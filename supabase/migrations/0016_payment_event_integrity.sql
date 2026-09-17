create or replace function public.thuraya_payment_event(p_provider text,p_event text,p_order text,p_amount integer,p_currency text,p_outcome text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare o public.orders; prior private.payment_events;
begin
 if p_provider not in('card','bit','paybox','paypal','bank_transfer') or length(p_event) not between 1 and 200 or p_outcome not in('pending','paid','failed','refunded') then raise exception 'invalid_payment_event';end if;
 select * into o from public.orders where id=p_order for update;
 if not found or p_provider<>o.payment_method or p_currency<>'ILS' or p_amount<>o.total then raise exception 'payment_mismatch';end if;
 insert into private.payment_events values(p_provider,p_event,p_order,p_amount,p_currency,p_outcome,now()) on conflict do nothing;
 if not found then
  select * into prior from private.payment_events where provider=p_provider and event_id=p_event;
  if prior.order_id<>p_order or prior.amount<>p_amount or prior.currency<>p_currency or prior.outcome<>p_outcome then raise exception 'payment_event_conflict';end if;
  return jsonb_build_object('duplicate',true);
 end if;
 if p_outcome='paid' and o.payment_status='pending' then perform public.thuraya_change_order(p_order,'payment_confirmed','provider:'||p_provider,true);
 elsif p_outcome='refunded' and o.payment_status='paid' then perform public.thuraya_change_order(p_order,'refunded','provider:'||p_provider,true);
 elsif p_outcome='refunded' and o.payment_status<>'refunded' then raise exception 'refund_requires_payment';end if;
 -- Late pending/failed/paid events never regress paid or refunded orders.
 return jsonb_build_object('ok',true);
end $$;
