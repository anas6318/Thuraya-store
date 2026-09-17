begin;
create function public.thuraya_public_product_media(p_id text) returns jsonb language sql security definer set search_path='' as $$
select jsonb_build_object('path',m.storage_path,'mime',m.mime,'kind',m.kind) from public.media m where m.id=p_id and m.storage_path is not null and (
exists(select 1 from public.product_media pm join public.products p on p.id=pm.product_id where pm.media_id=m.id and p.status='published' and (p.publish_at is null or p.publish_at<=now()))
or exists(select 1 from public.content_sections s where s.enabled and (s.image=m.src or strpos(s.image,m.storage_path)>0))
or exists(select 1 from public.categories c where c.active and (c.image=m.src or strpos(c.image,m.storage_path)>0))
or exists(select 1 from public.collections c where c.active and (c.image=m.src or strpos(c.image,m.storage_path)>0)))
$$;
revoke execute on function public.thuraya_public_product_media(text) from public,anon,authenticated;
grant execute on function public.thuraya_public_product_media(text) to service_role;
commit;
