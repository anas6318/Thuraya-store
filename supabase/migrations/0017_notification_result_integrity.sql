-- Provider acceptance is terminal: a delayed worker failure cannot undo it.
create or replace function public.thuraya_notification_result(p_id text,p_status text,p_provider_id text,p_error text,p_uncertain boolean default false,p_payload jsonb default null)
returns void language plpgsql security definer set search_path='' as $$
declare n private.notification_outbox;
begin
 if p_status is null or p_status not in ('sent','failed','disabled') then raise exception 'invalid_notification_result';end if;
 if p_status='sent' and (nullif(trim(p_provider_id),'') is null or p_uncertain) then raise exception 'acceptance_receipt_required';end if;
 select * into n from private.notification_outbox where id=p_id for update;
 if not found then raise exception 'notification_not_found';end if;
 if n.status='sent' then
  if p_status='sent' and n.provider_id is distinct from p_provider_id then raise exception 'acceptance_receipt_conflict';end if;
  return;
 end if;
 update private.notification_outbox set status=p_status,provider_id=p_provider_id,error=left(p_error,300),uncertain=p_uncertain,
 sent_at=case when p_status='sent' then now() else sent_at end,
 next_attempt_at=case when p_status='failed' and not p_uncertain then now()+interval '5 minutes' end,
 locked_at=null,payload=coalesce(payload,p_payload) where id=p_id;
 insert into private.notification_logs(notification_id,attempt,outcome,provider_id,error)
 values(p_id,n.attempts,p_status,p_provider_id,left(p_error,300));
end $$;
