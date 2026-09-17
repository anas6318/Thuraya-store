begin;

alter table public.addresses add column is_default boolean not null default false;
with ranked as (
 select id,row_number() over(partition by customer_id order by id) as rank from public.addresses
) update public.addresses a set is_default=(ranked.rank=1) from ranked where ranked.id=a.id;
create unique index addresses_one_default_per_customer on public.addresses(customer_id) where is_default;

create or replace function public.thuraya_save_address(p_customer uuid,p_address jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare existing public.addresses; desired boolean; is_update boolean:=false; result public.addresses;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_customer::text,23));
 if not exists(select 1 from public.profiles where id=p_customer) then raise exception 'forbidden'; end if;
 select * into existing from public.addresses where id=p_address->>'id' for update;
 is_update:=found;
 if found and existing.customer_id<>p_customer then raise exception 'forbidden'; end if;
 -- A caller selects a new default; ordinary edits may never unset the only default.
 desired:=coalesce((p_address->>'is_default')::boolean,false);
 if found and existing.is_default then desired:=true;
 elsif not found and not exists(select 1 from public.addresses where customer_id=p_customer and is_default) then desired:=true;
 end if;
 if desired then update public.addresses set is_default=false where customer_id=p_customer and id<>p_address->>'id' and is_default; end if;
 insert into public.addresses(id,customer_id,first_name,last_name,phone,city,street,postal_code,country,is_default)
 values(p_address->>'id',p_customer,p_address->>'first_name',p_address->>'last_name',p_address->>'phone',p_address->>'city',p_address->>'street',coalesce(p_address->>'postal_code',''),p_address->>'country',desired)
 on conflict(id) do update set first_name=excluded.first_name,last_name=excluded.last_name,phone=excluded.phone,city=excluded.city,street=excluded.street,postal_code=excluded.postal_code,country=excluded.country,is_default=excluded.is_default
 returning * into result;
 insert into private.audit_log(actor,action,target,summary) values(p_customer::text,'address_saved',result.id,case when is_update then 'Address updated' else 'Address created' end);
 return jsonb_build_object('id',result.id,'isDefault',result.is_default);
end$$;

create or replace function public.thuraya_delete_address(p_customer uuid,p_id text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare existing public.addresses; next_id text;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_customer::text,23));
 select * into existing from public.addresses where id=p_id for update;
 if not found or existing.customer_id<>p_customer then raise exception 'not_found'; end if;
 delete from public.addresses where id=p_id;
 if existing.is_default then
  select id into next_id from public.addresses where customer_id=p_customer order by id limit 1;
  if next_id is not null then update public.addresses set is_default=true where id=next_id; end if;
 end if;
 insert into private.audit_log(actor,action,target,summary) values(p_customer::text,'address_deleted',p_id,'Address removed');
 return jsonb_build_object('defaultId',next_id);
end$$;

-- Checkout may add consent, but it must never silently withdraw an existing
-- account preference. Explicit withdrawal happens in the authenticated account UI.
create or replace function private.persist_checkout_preferences() returns trigger
language plpgsql security definer set search_path='' as $$
declare account_id uuid;
begin
 select customer_id into account_id from public.orders where id=new.order_id;
 if account_id is not null then
  update public.profiles set
   marketing_consent=marketing_consent or coalesce((new.customer->>'marketingConsent')::boolean,false),
   whatsapp_updates=whatsapp_updates or coalesce((new.customer->>'whatsappUpdates')::boolean,false)
  where id=account_id;
 end if;
 return new;
end$$;
drop trigger if exists persist_checkout_preferences on private.order_contacts;
create trigger persist_checkout_preferences after insert on private.order_contacts for each row execute function private.persist_checkout_preferences();

-- Transactional order notices are not marketing. Optional profile preferences
-- remain stored for future non-transactional use and WhatsApp still requires opt-in.
create or replace function private.enqueue(p_order text,p_event text,p_status text,p_owner boolean default false) returns void language plpgsql set search_path='' as $$
declare s jsonb;loc text;ch text;t jsonb;consent boolean;preferred public.profiles;
begin
 select config into s from public.store_settings limit 1;
 select locale into loc from public.orders where id=p_order;
 select p.* into preferred from public.profiles p join public.orders o on o.customer_id=p.id where o.id=p_order;
 if found then loc:=preferred.locale; end if;
 select coalesce((customer->>'whatsappUpdates')::boolean,false) into consent from private.order_contacts where order_id=p_order;
 if preferred.id is not null then consent:=consent and preferred.whatsapp_updates; end if;
 foreach ch in array array['email','whatsapp'] loop
  select x into t from jsonb_array_elements(s->'templates') x where x->>'status'=p_status and x->>'channel'=ch limit 1;
  insert into private.notification_outbox(event_id,order_id,channel,audience,template_id,locale,status)
  values(p_event,p_order,ch,'customer',coalesce(t->>'id',p_status||'-'||ch),loc,
   case when coalesce((t->>'enabled')::boolean,false) and (ch='email' and coalesce((s->>'emailEnabled')::boolean,false) or ch='whatsapp' and consent and coalesce((s->>'whatsappEnabled')::boolean,false)) then 'pending' else 'disabled' end)
  on conflict do nothing;
 end loop;
 if p_owner then
  insert into private.notification_outbox(event_id,order_id,channel,audience,template_id,locale,status)
  values(p_event,p_order,'email','owner','owner-new-order','en',case when coalesce((s->>'emailEnabled')::boolean,false) then 'pending' else 'disabled' end) on conflict do nothing;
 end if;
end$$;

revoke all on function public.thuraya_save_address(uuid,jsonb) from public,anon,authenticated;
revoke all on function public.thuraya_delete_address(uuid,text) from public,anon,authenticated;
grant execute on function public.thuraya_save_address(uuid,jsonb) to service_role;
grant execute on function public.thuraya_delete_address(uuid,text) to service_role;
revoke all on function private.persist_checkout_preferences() from public,anon,authenticated;
commit;
