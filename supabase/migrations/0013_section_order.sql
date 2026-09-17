-- Reorder the complete section list atomically; stale lists cannot drop a section.
create function public.thuraya_reorder_sections(p_ids text[],p_actor uuid)
returns void language plpgsql security definer set search_path='' as $$
declare actor_role text;
begin
 select role into actor_role from public.profiles where id=p_actor;
 if actor_role is null or actor_role not in ('owner','admin','content_manager') then raise exception 'forbidden'; end if;
 lock table public.content_sections in share row exclusive mode;
 if cardinality(p_ids) is null or cardinality(p_ids)<>(select count(*) from public.content_sections)
 or cardinality(p_ids)<>(select count(distinct id) from unnest(p_ids) id)
 or exists(select 1 from unnest(p_ids) wanted(id) where not exists(select 1 from public.content_sections s where s.id=wanted.id))
 then raise exception 'stale_section_order'; end if;
 update public.content_sections s set position=ordered.ordinality-1
 from unnest(p_ids) with ordinality ordered(id,ordinality) where s.id=ordered.id;
 insert into private.audit_log(actor,action,target,summary) values(p_actor::text,'reorder_sections','homepage','Section order updated');
end $$;
revoke all on function public.thuraya_reorder_sections(text[],uuid) from public,anon,authenticated;
grant execute on function public.thuraya_reorder_sections(text[],uuid) to service_role;
