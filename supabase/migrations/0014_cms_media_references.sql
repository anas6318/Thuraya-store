-- Keep the current CMS API shape while enforcing uploaded-image references atomically.
create table private.cms_media_references (
 entity text not null check(entity in('content_sections','categories','collections')),
 record_id text not null,
 media_id text not null references public.media(id) on delete restrict,
 primary key(entity,record_id)
);
alter table private.cms_media_references enable row level security;
revoke all on private.cms_media_references from public,anon,authenticated;
create index cms_media_reference_media_idx on private.cms_media_references(media_id);
create function private.sync_cms_media_reference() returns trigger language plpgsql security definer set search_path='' as $$
declare target_id text;
begin
 if TG_OP='DELETE' then
  delete from private.cms_media_references where entity=TG_TABLE_NAME and record_id=old.id;
  return old;
 end if;
 select m.id into target_id from public.media m
 where new.image=m.src or m.storage_path is not null and strpos(new.image,m.storage_path)>0
 order by m.id limit 1;
 if target_id is null and new.image<>'' and new.image !~ '^/media/[a-zA-Z0-9._-]+$' then
  raise exception 'invalid_media';
 end if;
 delete from private.cms_media_references where entity=TG_TABLE_NAME and record_id=new.id;
 if target_id is not null then
  insert into private.cms_media_references(entity,record_id,media_id) values(TG_TABLE_NAME,new.id,target_id);
 end if;
 return new;
end $$;
revoke all on function private.sync_cms_media_reference() from public,anon,authenticated;
create trigger sync_section_media before insert or update of image or delete on public.content_sections for each row execute function private.sync_cms_media_reference();
create trigger sync_category_media before insert or update of image or delete on public.categories for each row execute function private.sync_cms_media_reference();
create trigger sync_collection_media before insert or update of image or delete on public.collections for each row execute function private.sync_cms_media_reference();
-- Backfill known references without silently changing legacy external content.
insert into private.cms_media_references(entity,record_id,media_id)
select distinct on (c.entity,c.id) c.entity,c.id,m.id from (
 select 'content_sections' entity,id,image from public.content_sections
 union all select 'categories',id,image from public.categories
 union all select 'collections',id,image from public.collections
) c join public.media m on c.image=m.src or m.storage_path is not null and strpos(c.image,m.storage_path)>0
order by c.entity,c.id,m.id;
