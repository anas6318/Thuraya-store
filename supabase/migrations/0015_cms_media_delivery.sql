-- Resolve CMS media by its relational identity, not by expiring URL text.
create or replace function private.sync_cms_media_reference() returns trigger language plpgsql security definer set search_path='' as $$
declare target_id text;
begin
 if TG_OP='DELETE' then delete from private.cms_media_references where entity=TG_TABLE_NAME and record_id=old.id;return old;end if;
 if TG_OP='UPDATE' and new.image=old.image then return new;end if;
 select m.id into target_id from public.media m where new.image=m.src or m.storage_path is not null and strpos(new.image,m.storage_path)>0 order by m.id limit 1;
 if target_id is null and new.image<>'' and new.image !~ '^/media/[a-zA-Z0-9._-]+$' then raise exception 'invalid_media';end if;
 delete from private.cms_media_references where entity=TG_TABLE_NAME and record_id=new.id;
 if target_id is not null then insert into private.cms_media_references values(TG_TABLE_NAME,new.id,target_id);end if;
 return new;
end $$;
create function public.thuraya_cms_media() returns jsonb language sql security definer set search_path='' as $$
 select coalesce(jsonb_agg(jsonb_build_object('entity',r.entity,'recordId',r.record_id,'media',jsonb_build_object('id',m.id,'src',m.src,'storagePath',m.storage_path,'alt',m.alt,'kind',m.kind,'width',m.width,'height',m.height,'mime',m.mime,'position',m.position))),'[]')
 from private.cms_media_references r join public.media m on m.id=r.media_id
$$;
revoke all on function public.thuraya_cms_media() from public,anon,authenticated;
grant execute on function public.thuraya_cms_media() to service_role;
create or replace function public.thuraya_public_product_media(p_id text) returns jsonb language sql security definer set search_path='' as $$
 select jsonb_build_object('path',m.storage_path,'mime',m.mime,'kind',m.kind) from public.media m where m.id=p_id and m.storage_path is not null and (
 exists(select 1 from public.product_media pm join public.products p on p.id=pm.product_id where pm.media_id=m.id and p.status='published' and (p.publish_at is null or p.publish_at<=now()))
 or exists(select 1 from private.cms_media_references r where r.media_id=m.id and (
 r.entity='content_sections' and exists(select 1 from public.content_sections s where s.id=r.record_id and s.enabled)
 or r.entity='categories' and exists(select 1 from public.categories c where c.id=r.record_id and c.active)
 or r.entity='collections' and exists(select 1 from public.collections c where c.id=r.record_id and c.active))))
$$;
