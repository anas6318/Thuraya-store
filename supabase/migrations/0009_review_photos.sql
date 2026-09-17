begin;
create table private.review_sessions(review_id text primary key references public.reviews(id),token_hash text not null,expires_at timestamptz not null default now()+interval '2 hours');
create table private.review_uploads(path text primary key,review_id text not null references public.reviews(id),mime text not null,bytes integer not null check(bytes between 1 and 5242880),confirmed boolean not null default false,created_at timestamptz not null default now());
alter table private.review_sessions enable row level security;
alter table private.review_uploads enable row level security;
revoke all on private.review_sessions,private.review_uploads from public,anon,authenticated;
create index review_uploads_review on private.review_uploads(review_id);
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('review-media','review-media',false,5242880,array['image/jpeg','image/png','image/webp','image/avif']);
create function public.thuraya_create_review(p jsonb,p_hash text,p_customer uuid,p_verified boolean) returns text language plpgsql security definer set search_path='' as $$declare rid text;begin
if not exists(select 1 from public.products where id=p->>'productId' and status='published' and (publish_at is null or publish_at<=now())) then raise exception 'unavailable';end if;
insert into public.reviews(product_id,customer_id,name,rating,text,verified,status) values(p->>'productId',p_customer,p->>'name',(p->>'rating')::integer,p->>'text',p_verified,'pending') returning id into rid;
insert into private.review_sessions(review_id,token_hash) values(rid,p_hash);return rid;end$$;
create function public.thuraya_review_upload(p_review text,p_hash text,p_action text,p_path text,p_mime text default null,p_bytes integer default null) returns jsonb language plpgsql security definer set search_path='' as $$declare ticket private.review_uploads;begin
perform 1 from private.review_sessions where review_id=p_review and token_hash=p_hash and expires_at>now() for update;
if not found then raise exception 'forbidden';end if;
perform 1 from public.reviews where id=p_review and status='pending' for update;
if not found then raise exception 'forbidden';end if;
if p_action='reserve' then
 if p_path not like p_review||'/%' or p_mime not in('image/jpeg','image/png','image/webp','image/avif') or (select count(*) from private.review_uploads where review_id=p_review)>=3 then raise exception 'invalid_upload';end if;
 insert into private.review_uploads(path,review_id,mime,bytes) values(p_path,p_review,p_mime,p_bytes) returning * into ticket;
else
 select * into ticket from private.review_uploads where path=p_path and review_id=p_review for update;
 if not found then raise exception 'invalid_upload';end if;
 if p_action='confirm' and not ticket.confirmed then
  update private.review_uploads set confirmed=true where path=p_path;
  update public.reviews set media=array_append(media,p_path) where id=p_review;
 elsif p_action not in('check','confirm') then raise exception 'invalid_action';end if;
end if;return to_jsonb(ticket);end$$;
-- Public delivery must recheck moderation and product publication on every request.
create function public.thuraya_public_review_media(p_path text) returns text language sql security definer set search_path='' as $$
select u.mime from private.review_uploads u join public.reviews r on r.id=u.review_id join public.products p on p.id=r.product_id
where u.path=p_path and u.confirmed and p_path=any(r.media) and r.status='approved' and p.status='published' and (p.publish_at is null or p.publish_at<=now())
$$;
revoke execute on function public.thuraya_create_review(jsonb,text,uuid,boolean),public.thuraya_review_upload(text,text,text,text,text,integer),public.thuraya_public_review_media(text) from public,anon,authenticated;
grant execute on function public.thuraya_create_review(jsonb,text,uuid,boolean),public.thuraya_review_upload(text,text,text,text,text,integer),public.thuraya_public_review_media(text) to service_role;
commit;
