begin;
create or replace function private.enqueue(p_order text,p_event text,p_status text,p_owner boolean default false) returns void language plpgsql set search_path='' as $$declare s jsonb;loc text;ch text;t jsonb;consent boolean;email_consent boolean:=true;preferred public.profiles;begin
select config into s from public.store_settings limit 1;
select locale into loc from public.orders where id=p_order;
select p.* into preferred from public.profiles p join public.orders o on o.customer_id=p.id where o.id=p_order;
if found then loc:=preferred.locale;email_consent:=preferred.email_updates;end if;
select coalesce((customer->>'whatsappUpdates')::boolean,false) into consent from private.order_contacts where order_id=p_order;
if preferred.id is not null then consent:=consent and preferred.whatsapp_updates;end if;
foreach ch in array array['email','whatsapp'] loop
select x into t from jsonb_array_elements(s->'templates') x where x->>'status'=p_status and x->>'channel'=ch limit 1;
insert into private.notification_outbox(event_id,order_id,channel,audience,template_id,locale,status) values(p_event,p_order,ch,'customer',coalesce(t->>'id',p_status||'-'||ch),loc,
case when coalesce((t->>'enabled')::boolean,false) and (ch='email' and email_consent and coalesce((s->>'emailEnabled')::boolean,false) or ch='whatsapp' and consent and coalesce((s->>'whatsappEnabled')::boolean,false)) then 'pending' else 'disabled' end) on conflict do nothing;
end loop;
if p_owner then insert into private.notification_outbox(event_id,order_id,channel,audience,template_id,locale,status) values(p_event,p_order,'email','owner','owner-new-order','en',case when coalesce((s->>'emailEnabled')::boolean,false) then 'pending' else 'disabled' end) on conflict do nothing;end if;
end$$;
create function public.thuraya_notification_retry_state() returns jsonb language sql security definer set search_path='' as $$select coalesce(jsonb_agg(jsonb_build_object('id',id,'uncertain',uncertain,'firstAttemptAt',first_attempt_at)),'[]') from private.notification_outbox$$;
revoke execute on function public.thuraya_notification_retry_state() from public,anon,authenticated;
grant execute on function public.thuraya_notification_retry_state() to service_role;
commit;
