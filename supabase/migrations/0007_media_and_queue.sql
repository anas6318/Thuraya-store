begin;
create function public.thuraya_media_confirmed(p_path text) returns boolean language sql security definer set search_path='' as $$
select exists(select 1 from private.upload_tickets where path=p_path and confirmed)
$$;
revoke execute on function public.thuraya_media_confirmed(text) from public,anon,authenticated;
grant execute on function public.thuraya_media_confirmed(text) to service_role;

create function private.protect_content_media() returns trigger language plpgsql set search_path='' as $$begin
if exists(select 1 from public.content_sections where image=old.src or old.storage_path is not null and strpos(image,old.storage_path)>0)
or exists(select 1 from public.categories where image=old.src or old.storage_path is not null and strpos(image,old.storage_path)>0)
or exists(select 1 from public.collections where image=old.src or old.storage_path is not null and strpos(image,old.storage_path)>0)
then raise exception 'media_in_use';end if;return old;end$$;
create trigger protect_content_media before delete on public.media for each row execute function private.protect_content_media();
revoke execute on function private.protect_content_media() from public,anon,authenticated;

create or replace function public.thuraya_claim_notifications() returns jsonb language plpgsql security definer set search_path='' as $$declare result jsonb;begin
-- Never retry an ambiguous WhatsApp acceptance or an expired email idempotency window.
update private.notification_outbox set status='failed',uncertain=true,error='Unknown provider outcome; reconcile before any new send'
where status='pending' and ((channel='whatsapp' and locked_at<now()-interval '5 minutes') or (channel='email' and first_attempt_at<=now()-interval '23 hours'));
update private.notification_outbox set status='failed',error='Retry limit reached',locked_at=null where status='pending' and attempts>=5 and (locked_at is null or locked_at<now()-interval '5 minutes');
update private.notification_outbox set status='pending' where status='failed' and not uncertain and attempts<5 and next_attempt_at<=now() and (first_attempt_at is null or first_attempt_at>now()-interval '23 hours');
with claimed as (
select id from private.notification_outbox where status='pending' and not uncertain and attempts<5
and (next_attempt_at is null or next_attempt_at<=now())
and (locked_at is null or channel='email' and locked_at<now()-interval '5 minutes' and first_attempt_at>now()-interval '23 hours')
order by id for update skip locked limit 20
),updated as(update private.notification_outbox n set locked_at=now(),first_attempt_at=coalesce(first_attempt_at,now()),attempts=attempts+1 from claimed where n.id=claimed.id returning n.*)
select coalesce(jsonb_agg(to_jsonb(u)||jsonb_build_object('order',private.order_view(o),'contact',c.customer)),'[]') into result
from updated u join public.orders o on o.id=u.order_id join private.order_contacts c on c.order_id=o.id;return result;end$$;
commit;
