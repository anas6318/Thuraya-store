begin;
-- Case-insensitive checkout must identify exactly one promotion. Conflicting
-- historical codes stop migration for owner resolution; never silently merge usage.
create unique index discounts_code_casefold on private.discounts(upper(code));
alter table private.discounts add constraint discount_code_nonblank check(btrim(code)<>'' and code=btrim(code)) not valid;
create or replace function public.thuraya_admin_write(p_entity text,p_value jsonb,p_actor uuid) returns void
language plpgsql security definer set search_path='' as $$
declare schema_name text:='public';tbl text;role text;oldrow jsonb;summary text;
begin
 select profiles.role into role from public.profiles where id=p_actor;
 if role is null or role not in('owner','admin','content_manager','order_manager') then raise exception 'forbidden'; end if;
 if role='content_manager' and p_entity not in('categories','collections','sections','pages','media','reviews')
    or role='order_manager' and p_entity not in('inquiries','reviews') then raise exception 'forbidden'; end if;
 case p_entity
  when 'categories' then tbl:='categories'; when 'collections' then tbl:='collections'; when 'sections' then tbl:='content_sections';
  when 'pages' then tbl:='content_pages'; when 'zones' then tbl:='shipping_zones'; when 'media' then tbl:='media';
  when 'reviews' then tbl:='reviews'; when 'inquiries' then schema_name:='private';tbl:='concierge_requests';
  when 'discounts' then schema_name:='private';tbl:='discounts'; else raise exception 'invalid_entity';
 end case;
 if p_entity='discounts' then p_value:=p_value-'used'; end if;
 execute format('select to_jsonb(row) from %I.%I row where row.id=$1',schema_name,tbl) into oldrow using p_value->>'id';
 -- Initial seeded creation still needs a required position. Thereafter homepage
 -- and taxonomy ordering is controlled only by complete-list procedures.
 if oldrow is not null and p_entity in ('categories','collections','sections') then p_value:=p_value-'position'; end if;
 if p_entity='reviews' then
  update public.reviews set status=p_value->>'status' where id=p_value->>'id';
 elsif p_entity='inquiries' then
  update private.concierge_requests set status=p_value->>'status' where id=p_value->>'id';
 else
  perform private.upsert_row(schema_name,tbl,p_value);
 end if;
 summary:=private.audit_change_summary(oldrow,p_value);
 insert into private.audit_log(actor,action,target,summary) values(p_actor::text,'save_'||p_entity,p_value->>'id',summary);
end$$;

revoke all on function public.thuraya_admin_write(text,jsonb,uuid) from public,anon,authenticated;
grant execute on function public.thuraya_admin_write(text,jsonb,uuid) to service_role;
commit;
