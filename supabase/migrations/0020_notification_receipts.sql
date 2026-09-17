create table private.notification_receipts(
 provider text not null check(provider in('resend','meta')),
 event_id text not null check(length(event_id) between 1 and 200),
 message_id text not null check(length(message_id) between 1 and 200),
 state text not null check(state in('accepted','delivered','read','bounced','failed','complained','suppressed')),
 occurred_at timestamptz not null,
 received_at timestamptz not null default now(),
 primary key(provider,event_id)
);
alter table private.notification_receipts enable row level security;
revoke all on private.notification_receipts from public,anon,authenticated;
create index notification_receipt_message on private.notification_receipts(provider,message_id);
create unique index notification_message_identity on private.notification_outbox(channel,provider_id) where provider_id is not null;
-- Store authenticated receipts before send completion too. Association is derived by
-- exact provider message ID, never customer email, phone, or a caller's order ID.
create function public.thuraya_notification_receipt(p_provider text,p_event text,p_message text,p_state text,p_occurred timestamptz)
returns boolean language plpgsql security definer set search_path='' as $$
declare prior private.notification_receipts;
begin
 if p_occurred is null or not isfinite(p_occurred) or p_occurred>now()+interval '5 minutes' then raise exception 'invalid_receipt_time';end if;
 if p_provider='resend' and p_state='read' then raise exception 'unsupported_receipt_state';end if;
 insert into private.notification_receipts(provider,event_id,message_id,state,occurred_at) values(p_provider,p_event,p_message,p_state,p_occurred) on conflict do nothing;
 if found then return true;end if;
 select * into prior from private.notification_receipts where provider=p_provider and event_id=p_event;
 if prior.message_id is distinct from p_message or prior.state is distinct from p_state or prior.occurred_at is distinct from p_occurred then raise exception 'receipt_event_conflict';end if;
 return false;
end $$;
create function public.thuraya_receipt_projection() returns jsonb language sql security definer set search_path='' as $$
select coalesce(jsonb_agg(jsonb_build_object('id',n.id,'receiptState',r.state,'receiptAt',r.occurred_at,'receiptAlert',a.alert)),'[]')
from private.notification_outbox n
join lateral (
 select state,occurred_at from private.notification_receipts r
 where r.message_id=n.provider_id and r.provider=case when n.channel='email' then 'resend' else 'meta' end
 order by case state when 'read' then 4 when 'delivered' then 3 when 'accepted' then 1 else 2 end desc,occurred_at desc,event_id desc limit 1
) r on true
left join lateral (
 select state alert from private.notification_receipts r where r.message_id=n.provider_id
 and r.provider=case when n.channel='email' then 'resend' else 'meta' end
 and state in('bounced','failed','complained','suppressed') order by occurred_at desc,event_id desc limit 1
) a on true
$$;
revoke execute on function public.thuraya_notification_receipt(text,text,text,text,timestamptz),public.thuraya_receipt_projection() from public,anon,authenticated;
grant execute on function public.thuraya_notification_receipt(text,text,text,text,timestamptz),public.thuraya_receipt_projection() to service_role;
