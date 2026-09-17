-- Old result/payload functions remain internal for audited reconciliation only.
revoke execute on function public.thuraya_notification_result(text,text,text,text,boolean,jsonb) from service_role;
revoke execute on function public.thuraya_notification_payload(text,jsonb) from service_role;

create function public.thuraya_attempt_payload(p_id text,p_attempt integer,p_payload jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare n private.notification_outbox;
begin
 select * into n from private.notification_outbox where id=p_id for update;
 if not found or p_attempt is null or n.attempts<>p_attempt or n.status<>'pending' or n.locked_at is null then raise exception 'stale_notification_attempt';end if;
 return public.thuraya_notification_payload(p_id,p_payload);
end $$;

create function public.thuraya_attempt_result(p_id text,p_attempt integer,p_status text,p_provider_id text,p_error text,p_uncertain boolean default false)
returns boolean language plpgsql security definer set search_path='' as $$
declare n private.notification_outbox;
begin
 select * into n from private.notification_outbox where id=p_id for update;
 if not found or p_attempt is null or n.attempts<>p_attempt or n.status='sent' then return false;end if;
 -- A known acceptance may resolve a timeout hold, but a failed/disabled result cannot.
 if not (n.status='pending' and n.locked_at is not null) and not(p_status='sent' and n.status='failed' and n.uncertain) then return false;end if;
 perform public.thuraya_notification_result(p_id,p_status,p_provider_id,p_error,p_uncertain);
 return true;
end $$;
revoke execute on function public.thuraya_attempt_payload(text,integer,jsonb),public.thuraya_attempt_result(text,integer,text,text,text,boolean) from public,anon,authenticated;
grant execute on function public.thuraya_attempt_payload(text,integer,jsonb),public.thuraya_attempt_result(text,integer,text,text,text,boolean) to service_role;
