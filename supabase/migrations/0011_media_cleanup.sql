begin;
-- A media record pins its confirmed upload ticket. GC cannot race attachment.
alter table public.media add constraint media_upload_ticket_fk foreign key(storage_path) references private.upload_tickets(path);
create table private.media_cleanup(bucket text not null,path text not null,attempts integer not null default 0,last_error text,created_at timestamptz not null default now(),primary key(bucket,path));
alter table private.media_cleanup enable row level security;
revoke all on private.media_cleanup from public,anon,authenticated;
create function public.thuraya_collect_media_orphans() returns jsonb language plpgsql security definer set search_path='' as $$begin
with candidates as(select path from private.upload_tickets t where t.created_at<now()-interval '48 hours' and not exists(select 1 from public.media m where m.storage_path=t.path) for update skip locked limit 100),removed as(delete from private.upload_tickets where path in(select path from candidates) returning path)
insert into private.media_cleanup(bucket,path) select 'product-media',path from removed on conflict do nothing;
with candidates as(select u.path from private.review_uploads u join private.review_sessions s on s.review_id=u.review_id where not u.confirmed and u.created_at<now()-interval '48 hours' and s.expires_at<now() for update of u skip locked limit 100),removed as(delete from private.review_uploads where path in(select path from candidates) returning path)
insert into private.media_cleanup(bucket,path) select 'review-media',path from removed on conflict do nothing;
return (select coalesce(jsonb_agg(to_jsonb(x)),'[]') from (select bucket,path from private.media_cleanup where attempts<5 order by created_at limit 100)x);end$$;
create function public.thuraya_cleanup_result(p_bucket text,p_path text,p_success boolean) returns void language plpgsql security definer set search_path='' as $$begin
if p_success then delete from private.media_cleanup where bucket=p_bucket and path=p_path;else update private.media_cleanup set attempts=attempts+1,last_error='Storage deletion failed' where bucket=p_bucket and path=p_path;end if;end$$;
revoke execute on function public.thuraya_collect_media_orphans(),public.thuraya_cleanup_result(text,text,boolean) from public,anon,authenticated;
grant execute on function public.thuraya_collect_media_orphans(),public.thuraya_cleanup_result(text,text,boolean) to service_role;
commit;
