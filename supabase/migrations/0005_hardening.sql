begin;
create function public.thuraya_notification_payload(p_id text,p_payload jsonb) returns jsonb language plpgsql security definer set search_path='' as $$declare result jsonb;begin
update private.notification_outbox set payload=coalesce(payload,p_payload) where id=p_id and status='pending' and locked_at is not null returning payload into result;if result is null then raise exception 'claim_expired';end if;return result;end$$;
revoke execute on function public.thuraya_notification_payload(text,jsonb) from public,anon,authenticated;
grant execute on function public.thuraya_notification_payload(text,jsonb) to service_role;
-- Prevent changing ownership of durable IDs via an upsert, including cross-product axes.
create function private.immutable_parent() returns trigger language plpgsql set search_path='' as $$begin if to_jsonb(old)->TG_ARGV[0] is distinct from to_jsonb(new)->TG_ARGV[0] then raise exception 'immutable_parent';end if;return new;end$$;
create trigger variant_parent before update on public.product_variants for each row execute function private.immutable_parent('product_id');
create trigger axis_parent before update on public.option_axes for each row execute function private.immutable_parent('product_id');
create trigger option_parent before update on public.option_values for each row execute function private.immutable_parent('axis_id');
create trigger address_parent before update on public.addresses for each row execute function private.immutable_parent('customer_id');
revoke execute on function private.immutable_parent() from public,anon,authenticated;
commit;
