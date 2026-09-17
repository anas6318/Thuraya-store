begin;
-- Public clients have no direct business writes. All mutations pass authenticated,
-- role-checked Edge Functions. Private business tables never enter PostgREST.
do $$declare r record;begin for r in select tablename from pg_tables where schemaname in('public','private') loop execute format('alter table %I.%I enable row level security',(select schemaname from pg_tables where tablename=r.tablename and schemaname in('public','private') limit 1),r.tablename);end loop;end$$;
revoke all on all tables in schema public from anon,authenticated;
revoke all on all tables in schema private from public,anon,authenticated;
grant select on public.profiles to authenticated;
create policy self_profile on public.profiles for select to authenticated using(id=auth.uid());
grant select on public.products,public.product_translations,public.categories,public.collections,public.product_collections,public.option_axes,public.option_values,public.product_variants,public.variant_options,public.media,public.product_media,public.variant_media,public.content_sections,public.content_pages,public.reviews to anon,authenticated;
create policy published_products on public.products for select using(status='published' and (publish_at is null or publish_at<=now()));
create policy product_translations_read on public.product_translations for select using(exists(select 1 from public.products where id=product_id));
create policy categories_read on public.categories for select using(active);
create policy collections_read on public.collections for select using(active);
create policy product_collections_read on public.product_collections for select using(exists(select 1 from public.products where id=product_id));
create policy option_axes_read on public.option_axes for select using(exists(select 1 from public.products where id=product_id));
create policy option_values_read on public.option_values for select using(exists(select 1 from public.option_axes where id=axis_id));
create policy variants_read on public.product_variants for select using(active and exists(select 1 from public.products where id=product_id));
create policy variant_options_read on public.variant_options for select using(exists(select 1 from public.product_variants where id=variant_id));
create policy product_media_read on public.product_media for select using(exists(select 1 from public.products where id=product_id));
create policy variant_media_read on public.variant_media for select using(exists(select 1 from public.product_variants where id=variant_id));
create policy media_read on public.media for select using(exists(select 1 from public.product_media where media_id=media.id));
create policy sections_read on public.content_sections for select using(enabled);
create policy pages_read on public.content_pages for select using(status='published' and (kind<>'policy' or legal_reviewed));
create policy reviews_read on public.reviews for select using(status='approved');
-- Storage is private. Draft photos and certificates never receive public URLs.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('product-media','product-media',false,20971520,array['image/jpeg','image/png','image/webp','image/avif','video/mp4','application/pdf']) on conflict(id) do nothing;
-- No anon/authenticated write policies. Edge supplies short-lived signed upload
-- tickets after staff and MFA checks; confirm-upload validates magic bytes.
revoke execute on all functions in schema private from public,anon,authenticated;
commit;
