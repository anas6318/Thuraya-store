begin;

-- Categories and collections are customer-facing ordered lists. New records
-- append by default; existing records can move only through the complete-list
-- transaction below, so concurrent edits cannot create duplicate positions.
create function private.enforce_taxonomy_position() returns trigger
language plpgsql security definer set search_path='' as $$
declare next_position integer;
begin
 if TG_OP='INSERT' then
  if TG_TABLE_NAME='categories' then select coalesce(max(position)+1,0) into next_position from public.categories;
  else select coalesce(max(position)+1,0) into next_position from public.collections; end if;
  new.position:=next_position;
 elsif new.position is distinct from old.position
       and coalesce(current_setting('thuraya.taxonomy_reorder',true),'')<>'on' then
  raise exception 'use_taxonomy_reorder';
 end if;
 return new;
end $$;
revoke all on function private.enforce_taxonomy_position() from public,anon,authenticated;
drop trigger if exists enforce_category_position on public.categories;
drop trigger if exists enforce_collection_position on public.collections;
create trigger enforce_category_position before insert or update on public.categories
for each row execute function private.enforce_taxonomy_position();
create trigger enforce_collection_position before insert or update on public.collections
for each row execute function private.enforce_taxonomy_position();

create function public.thuraya_reorder_taxonomy(p_entity text,p_ids text[],p_actor uuid)
returns void language plpgsql security definer set search_path='' as $$
declare actor_role text; expected integer;
begin
 select role into actor_role from public.profiles where id=p_actor;
 if actor_role is null or actor_role not in('owner','admin','content_manager') then raise exception 'forbidden';end if;
 if p_entity not in('categories','collections') then raise exception 'invalid_taxonomy';end if;
 if p_entity='categories' then
  lock table public.categories in share row exclusive mode;
  select count(*) into expected from public.categories;
  if cardinality(p_ids) is null or cardinality(p_ids)<>expected or cardinality(p_ids)<>(select count(distinct id) from unnest(p_ids) id) or exists(select 1 from unnest(p_ids) wanted(id) where not exists(select 1 from public.categories t where t.id=wanted.id)) then raise exception 'stale_taxonomy_order';end if;
  perform set_config('thuraya.taxonomy_reorder','on',true);
  update public.categories t set position=ordered.ordinality-1 from unnest(p_ids) with ordinality ordered(id,ordinality) where t.id=ordered.id;
 else
  lock table public.collections in share row exclusive mode;
  select count(*) into expected from public.collections;
  if cardinality(p_ids) is null or cardinality(p_ids)<>expected or cardinality(p_ids)<>(select count(distinct id) from unnest(p_ids) id) or exists(select 1 from unnest(p_ids) wanted(id) where not exists(select 1 from public.collections t where t.id=wanted.id)) then raise exception 'stale_taxonomy_order';end if;
  perform set_config('thuraya.taxonomy_reorder','on',true);
  update public.collections t set position=ordered.ordinality-1 from unnest(p_ids) with ordinality ordered(id,ordinality) where t.id=ordered.id;
 end if;
 insert into private.audit_log(actor,action,target,summary) values(p_actor::text,'reorder_'||p_entity,p_entity,'Taxonomy order updated');
end $$;
revoke execute on function public.thuraya_reorder_taxonomy(text,text[],uuid) from public,anon,authenticated;
grant execute on function public.thuraya_reorder_taxonomy(text,text[],uuid) to service_role;
commit;
