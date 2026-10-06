begin;

-- Cancellation releases exactly the stock and coupon usage an order consumed.
-- order_stock_consumption is the per-order ledger of tracked stock decremented at checkout.
create table private.order_stock_consumption(order_id text not null references public.orders,variant_id text not null references public.product_variants,quantity integer not null check(quantity>0),primary key(order_id,variant_id));
alter table private.order_stock_consumption enable row level security;
revoke all on private.order_stock_consumption from public,anon,authenticated;
-- One row per released order; the primary key makes a second release impossible.
create table private.order_releases(order_id text primary key references public.orders,released_at timestamptz not null default now(),stock_units integer not null default 0 check(stock_units>=0),discount_id text,stock_ledger boolean not null);
alter table private.order_releases enable row level security;
revoke all on private.order_releases from public,anon,authenticated;
-- Orders created before this instant have no consumption ledger; their stock is never guessed.
create table private.order_stock_ledger_epoch(id boolean primary key default true check(id),started_at timestamptz not null);
alter table private.order_stock_ledger_epoch enable row level security;
revoke all on private.order_stock_ledger_epoch from public,anon,authenticated;

create or replace function public.thuraya_place_order(p_input jsonb,p_email_hash text,p_phone_hash text,p_request_hash text,p_customer uuid default null) returns jsonb language plpgsql security definer set search_path='' as $$declare existing private.checkout_keys;cfg jsonb;z public.shipping_zones;d private.discounts;l jsonb;p public.products;v public.product_variants;sub integer:=0;eligible integer:=0;saving integer:=0;ship integer;qty integer;unit integer;ord public.orders;ev text;idkey uuid:=(p_input->>'idempotencyKey')::uuid;emin integer;emax integer;method jsonb;begin
perform pg_advisory_xact_lock(hashtextextended(idkey::text,0));select * into existing from private.checkout_keys where key=idkey;if found then if existing.request_hash<>p_request_hash then raise exception 'idempotency_conflict';end if;select * into ord from public.orders where id=existing.order_id;return private.order_view(ord);end if;
select config into cfg from public.store_settings limit 1;if not coalesce((cfg->>'checkoutEnabled')::boolean,false) or coalesce((cfg->>'maintenance')::boolean,false) then raise exception 'checkout_unavailable';end if;
select x into method from jsonb_array_elements(cfg->'paymentMethods') x where x->>'id'=p_input->>'paymentMethod';if not coalesce((method->>'enabled')::boolean,false) then raise exception 'payment_unavailable';end if;
select * into z from public.shipping_zones where id=p_input->>'zoneId' and active and country=p_input->>'country';if not found or cardinality(z.cities)>0 and not (p_input->>'city'=any(z.cities)) then raise exception 'shipping_unavailable';end if;
if coalesce(p_input->>'discountCode','')<>'' then select * into d from private.discounts where upper(code)=upper(p_input->>'discountCode') for update;if not found or not d.active or d.starts_at>now() or d.ends_at<=now() or d.usage_limit is not null and d.used>=d.usage_limit then raise exception 'discount_unavailable';end if;end if;
emin:=greatest(z.eta_min,(cfg->>'leadMin')::integer);emax:=greatest(z.eta_max,(cfg->>'leadMax')::integer);
-- Lock variants in stable order; inventory and coupon usage are serialized.
perform 1 from public.product_variants where id in(select x->>'variantId' from jsonb_array_elements(p_input->'lines') x) order by id for update;
for l in select x from jsonb_array_elements(p_input->'lines') x loop qty:=(l->>'quantity')::integer;if qty<1 or qty>10 then raise exception 'invalid_quantity';end if;select * into p from public.products where id=l->>'productId' and status='published' and (publish_at is null or publish_at<=now()) for share;if not found or p.base_price is null or not ((p_input->>'country')=any(p.shipping_countries)) then raise exception 'unavailable';end if;select * into v from public.product_variants where id=l->>'variantId' and product_id=p.id and active;if not found then raise exception 'unavailable';end if;unit:=p.base_price+v.adjustment;if unit<0 then raise exception 'invalid_price';end if;if v.stock is not null then update public.product_variants set stock=stock-qty where id=v.id and stock>=qty;if not found then raise exception 'stock';end if;end if;sub:=sub+unit*qty;if d.id is not null and (cardinality(d.product_ids)=0 and cardinality(d.collection_ids)=0 or p.id=any(d.product_ids) or exists(select 1 from public.product_collections where product_id=p.id and collection_id=any(d.collection_ids))) then eligible:=eligible+unit*qty;end if;emin:=greatest(emin,coalesce(p.lead_min,(cfg->>'leadMin')::integer));emax:=greatest(emax,coalesce(p.lead_max,(cfg->>'leadMax')::integer));end loop;
if sub<=0 then raise exception 'invalid_total';end if;if d.id is not null then if sub<d.minimum_subtotal or eligible=0 then raise exception 'discount_unavailable';end if;saving:=least(eligible,case when d.kind='fixed' then d.value else floor(eligible::numeric*d.value/100)::integer end);end if;
ship:=case when cfg->>'freeShippingThreshold' is not null and sub>=(cfg->>'freeShippingThreshold')::integer then 0 else z.price end;
insert into public.orders(customer_id,locale,payment_method,subtotal,discount,shipping,total,eta_min,eta_max) values(p_customer,p_input->>'locale',p_input->>'paymentMethod',sub,saving,ship,sub-saving+ship,emin,emax) returning * into ord;
insert into private.order_contacts(order_id,email_hash,phone_hash,customer) values(ord.id,p_email_hash,p_phone_hash,p_input-'lines'-'idempotencyKey'-'turnstileToken');
for l in select x from jsonb_array_elements(p_input->'lines') x loop select * into p from public.products where id=l->>'productId';select * into v from public.product_variants where id=l->>'variantId';unit:=p.base_price+v.adjustment;qty:=(l->>'quantity')::integer;insert into public.order_items(order_id,product_id,variant_id,sku,name,image,options,gem,metal,measurements,quantity,unit_price,line_total) values(ord.id,p.id,v.id,v.sku,private.l10n(p.id,'name'),coalesce((select src from public.product_media pm join public.media m on m.id=pm.media_id where pm.product_id=p.id order by pm.position limit 1),''),(select coalesce(jsonb_agg(ov.label),'[]') from public.variant_options vo join public.option_values ov on ov.id=vo.value_id where vo.variant_id=v.id),p.gem||v.gem,p.metal||v.metal,p.measurements||v.measurements,qty,unit,unit*qty);if v.stock is not null then insert into private.order_stock_consumption(order_id,variant_id,quantity) values(ord.id,v.id,qty) on conflict(order_id,variant_id) do update set quantity=private.order_stock_consumption.quantity+excluded.quantity;end if;end loop;
insert into public.order_events(order_id,status) values(ord.id,'order_received') returning id into ev;perform private.enqueue(ord.id,ev,'order_received',true);insert into public.order_events(order_id,status,at) values(ord.id,'payment_pending',now()+interval '1 millisecond');
insert into private.checkout_keys(key,request_hash,order_id) values(idkey,p_request_hash,ord.id);if d.id is not null then update private.discounts set used=used+1 where id=d.id;insert into private.discount_redemptions(discount_id,order_id,amount) values(d.id,ord.id,saving);end if;insert into private.audit_log(actor,action,target,summary) values(coalesce(p_customer::text,'guest'),'order_created',ord.id,'Order and notification outbox committed');return private.order_view(ord);end$$;
create or replace function public.thuraya_change_order(p_id text,p_status text,p_actor text,p_provider boolean default false) returns jsonb language plpgsql security definer set search_path='' as $$declare o public.orders;allowed text[];ev text;red private.discount_redemptions;coupon boolean:=false;ledger boolean;units integer:=0;skipped integer:=0;begin select * into o from public.orders where id=p_id for update;if not found then raise exception 'not_found';end if;
allowed:=case o.status when 'order_received' then array['payment_pending','cancelled'] when 'payment_pending' then array['payment_confirmed','cancelled'] when 'payment_confirmed' then array['in_production','refunded'] when 'in_production' then array['quality_check','refunded'] when 'quality_check' then array['ready_to_ship','in_production','refunded'] when 'ready_to_ship' then array['shipped','quality_check','refunded'] when 'shipped' then array['delivered','refunded'] when 'delivered' then array['refunded'] else array[]::text[] end;
if not (p_status=any(allowed)) then raise exception 'invalid_transition';end if;if p_status in('payment_confirmed','refunded') and o.payment_method<>'bank_transfer' and not p_provider then raise exception 'provider_confirmation_required';end if;
-- Cancellation releases what this order consumed, once, in this transaction. Lock order matches checkout: discount, then variants by id.
if p_status='cancelled' then ledger:=exists(select 1 from private.order_stock_consumption where order_id=p_id) or o.created_at>=(select started_at from private.order_stock_ledger_epoch);insert into private.order_releases(order_id,stock_ledger) values(p_id,ledger) on conflict do nothing;if found then
select * into red from private.discount_redemptions where order_id=p_id;if found then update private.discounts set used=used-1 where id=red.discount_id and used>0;coupon:=found;end if;
if ledger then perform 1 from public.product_variants where id in(select variant_id from private.order_stock_consumption where order_id=p_id) order by id for update;with r as (update public.product_variants v set stock=v.stock+c.quantity from private.order_stock_consumption c where c.order_id=p_id and c.variant_id=v.id and v.stock is not null returning c.quantity) select coalesce(sum(quantity),0)::integer into units from r;select coalesce(sum(c.quantity),0)::integer into skipped from private.order_stock_consumption c join public.product_variants v on v.id=c.variant_id where c.order_id=p_id and v.stock is null;end if;
update private.order_releases set stock_units=units,discount_id=case when coupon then red.discount_id end where order_id=p_id;
insert into private.audit_log(actor,action,target,summary) values(p_actor,'order_resources_released',p_id,case when ledger then 'stock restored: '||units||' units'||case when skipped>0 then '; '||skipped||' units not restored (stock tracking now off), verify inventory manually' else '' end else 'stock not restored: order predates the stock ledger, verify inventory manually' end||'; coupon released: '||case when coupon then 'yes' when red.discount_id is not null then 'no (usage count already 0)' else 'no' end);end if;end if;
update public.orders set status=p_status,payment_status=case when p_status='payment_confirmed' then 'paid' when p_status='refunded' then 'refunded' else payment_status end where id=p_id returning * into o;insert into public.order_events(order_id,status) values(p_id,p_status) returning id into ev;perform private.enqueue(p_id,ev,p_status);insert into private.audit_log(actor,action,target,summary) values(p_actor,'order_status',p_id,p_status);return private.order_view(o);end$$;
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
 -- A payment that arrives after cancellation is kept as evidence and surfaced for manual handling; it never revives the order.
 if o.status='cancelled' then
  if p_outcome in('paid','refunded') then insert into private.audit_log(actor,action,target,summary) values('provider:'||p_provider,'payment_after_cancellation',p_order,p_outcome||' '||(p_amount::numeric/100)::numeric(14,2)||' ILS event '||p_event);end if;
  return jsonb_build_object('ok',true,'held','order_cancelled');
 end if;
 if p_outcome='paid' and o.payment_status='pending' then perform public.thuraya_change_order(p_order,'payment_confirmed','provider:'||p_provider,true);
 elsif p_outcome='refunded' and o.payment_status='paid' then perform public.thuraya_change_order(p_order,'refunded','provider:'||p_provider,true);
 elsif p_outcome='refunded' and o.payment_status<>'refunded' then raise exception 'refund_requires_payment';end if;
 -- Late pending/failed/paid events never regress paid or refunded orders.
 return jsonb_build_object('ok',true);
end $$;

-- Last statement: clock_timestamp(), not transaction start, so orders whose checkout began before this point count as pre-ledger.
insert into private.order_stock_ledger_epoch(started_at) values(clock_timestamp());
commit;
