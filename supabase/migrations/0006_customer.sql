begin;
create function public.thuraya_set_wishlist(p_customer uuid,p_ids text[]) returns void language plpgsql security definer set search_path='' as $$begin
perform pg_advisory_xact_lock(hashtextextended(p_customer::text,1));delete from public.wishlists where customer_id=p_customer;insert into public.wishlists select p_customer,id from public.products where id=any(p_ids) and status='published' on conflict do nothing;end$$;
revoke execute on function public.thuraya_set_wishlist(uuid,text[]) from public,anon,authenticated;
grant execute on function public.thuraya_set_wishlist(uuid,text[]) to service_role;
commit;
