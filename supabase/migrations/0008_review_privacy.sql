begin;
-- RLS controls rows, not columns. Customer identity must also be excluded from
-- direct PostgREST reads, not only the catalog Edge response.
revoke select on public.reviews from anon,authenticated;
grant select(id,product_id,name,rating,text,media,verified,status,created_at)
on public.reviews to anon,authenticated;
drop policy reviews_read on public.reviews;
create policy reviews_read on public.reviews for select using(
  status='approved' and exists(select 1 from public.products where id=product_id)
);
commit;
