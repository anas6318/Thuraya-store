-- Explicit operator attestation; not an automated provider receipt or a resend.
create function public.thuraya_reconcile_notification(p_id text,p_receipt text,p_actor uuid)
returns void language plpgsql security definer set search_path='' as $$
declare n private.notification_outbox;
begin
 if not exists(select 1 from public.profiles where id=p_actor and role in('owner','admin')) then raise exception 'forbidden';end if;
 if p_receipt is null or p_receipt !~ '^[A-Za-z0-9._:/=-]{1,200}$' then raise exception 'invalid_receipt';end if;
 select * into n from private.notification_outbox where id=p_id for update;
 if not found then raise exception 'not_reconcilable';end if;
 if n.status='sent' and n.provider_id=p_receipt then return;end if;
 if n.status<>'failed' or not n.uncertain then raise exception 'not_reconcilable';end if;
 perform public.thuraya_notification_result(p_id,'sent',p_receipt,null,false);
 insert into private.audit_log(actor,action,target,summary)
 values(p_actor::text,'notification_reconciled',p_id,'Operator attested provider acceptance using provider message ID; no resend');
end $$;
revoke execute on function public.thuraya_reconcile_notification(text,text,uuid) from public,anon,authenticated;
grant execute on function public.thuraya_reconcile_notification(text,text,uuid) to service_role;
