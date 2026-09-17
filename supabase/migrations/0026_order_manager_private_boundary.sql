begin;

-- Order managers may operate fulfilment, but supplier/internal details remain
-- owner/admin-only.  The rule is enforced in the authoritative write function,
-- not only by hiding fields in the Admin interface.
create or replace function public.thuraya_private_write(p_action text,p_value jsonb,p_actor uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare role text;
begin
 select profiles.role into role from public.profiles where id=p_actor;
 if p_action='product' then
  if role not in('owner','admin') then raise exception 'forbidden';end if;
  perform private.upsert_row('private','product_business',p_value,'product_id');
 elsif p_action='order' then
  if role not in('owner','admin','order_manager') then raise exception 'forbidden';end if;
  if role in('owner','admin') then
   if not(p_value?'internalNotes') or not(p_value?'supplierReference') then raise exception 'invalid_order_patch';end if;
   update private.order_contacts set internal_notes=p_value->>'internalNotes',supplier_reference=p_value->>'supplierReference' where order_id=p_value->>'id';
  elsif p_value?'internalNotes' or p_value?'supplierReference' then
   raise exception 'forbidden';
  end if;
  update public.orders set safe_tracking_url=nullif(p_value->>'safeTrackingUrl',''),eta_min=(p_value->>'etaMin')::integer,eta_max=(p_value->>'etaMax')::integer where id=p_value->>'id';
 elsif p_action='retry' then
  if role not in('owner','admin','order_manager') then raise exception 'forbidden';end if;
  update private.notification_outbox set status='pending',next_attempt_at=now(),locked_at=null where id=p_value->>'id' and status='failed' and attempts<5 and not uncertain and (first_attempt_at is null or first_attempt_at>now()-interval '23 hours');
  if not found then raise exception 'not_retryable';end if;
 elsif p_action='inquiry' then
  insert into private.concierge_requests(product_id,name,email,phone,message,locale) values(nullif(p_value->>'productId',''),p_value->>'name',p_value->>'email',p_value->>'phone',p_value->>'message',p_value->>'locale');
 elsif p_action='upload-ticket' then
  if role not in('owner','admin','content_manager') then raise exception 'forbidden';end if;
  insert into private.upload_tickets(path,actor,mime,bytes) values(p_value->>'path',p_actor,p_value->>'mime',(p_value->>'bytes')::integer);
 elsif p_action='upload-check' then
  if role not in('owner','admin','content_manager') then raise exception 'forbidden';end if;
  return (select to_jsonb(t) from private.upload_tickets t where path=p_value->>'path' and actor=p_actor);
 elsif p_action='upload-confirm' then
  update private.upload_tickets set confirmed=true where path=p_value->>'path' and actor=p_actor;
 elsif p_action='delete-media' then
  if role not in('owner','admin','content_manager') then raise exception 'forbidden';end if;
  delete from public.media where id=p_value->>'id';
 else raise exception 'invalid_action';end if;
 insert into private.audit_log(actor,action,target,summary) values(coalesce(p_actor::text,'guest'),p_action,coalesce(p_value->>'id',p_value->>'path',p_value->>'product_id','request'),'Operation recorded');
 return '{}'::jsonb;
end $$;

commit;
