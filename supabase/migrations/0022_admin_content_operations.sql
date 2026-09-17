begin;

-- A path waiting for object cleanup must never be re-attached to a new media
-- record. Without this guard a delayed worker could delete newly referenced
-- product photography. Operators can upload a new object instead.
create function private.prevent_queued_media_reuse() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 if new.storage_path is not null and exists(
   select 1 from private.media_cleanup c
   where c.bucket='product-media' and c.path=new.storage_path
 ) then
   raise exception 'media_cleanup_pending';
 end if;
 return new;
end $$;
revoke all on function private.prevent_queued_media_reuse() from public,anon,authenticated;
drop trigger if exists prevent_queued_media_reuse on public.media;
create trigger prevent_queued_media_reuse before insert or update of storage_path on public.media
for each row execute function private.prevent_queued_media_reuse();

-- Legacy rows created before the attachment guard can never be returned to a
-- worker once they have a live reference.
create or replace function public.thuraya_collect_media_orphans() returns jsonb
language plpgsql security definer set search_path='' as $$
begin
 delete from private.media_cleanup c using public.media m
 where c.bucket='product-media' and c.path=m.storage_path;
 with candidates as(
   select path from private.upload_tickets t
   where t.created_at<now()-interval '48 hours'
     and not exists(select 1 from public.media m where m.storage_path=t.path)
   for update skip locked limit 100
 ),removed as(
   delete from private.upload_tickets where path in(select path from candidates) returning path
 )
 insert into private.media_cleanup(bucket,path)
 select 'product-media',path from removed on conflict do nothing;
 with candidates as(
   select u.path from private.review_uploads u
   join private.review_sessions s on s.review_id=u.review_id
   where not u.confirmed and u.created_at<now()-interval '48 hours' and s.expires_at<now()
   for update of u skip locked limit 100
 ),removed as(
   delete from private.review_uploads where path in(select path from candidates) returning path
 )
 insert into private.media_cleanup(bucket,path)
 select 'review-media',path from removed on conflict do nothing;
 return (select coalesce(jsonb_agg(to_jsonb(x)),'[]') from (
   select bucket,path from private.media_cleanup where attempts<5 order by created_at limit 100
 ) x);
end $$;

-- These are operational metadata, not customer-facing media. Both functions
-- are service-role-only and the Edge API applies the media capability check.
create function public.thuraya_media_cleanup_status() returns jsonb
language sql security definer set search_path='' as $$
 select coalesce(jsonb_agg(jsonb_build_object(
   'bucket',bucket,'path',path,'attempts',attempts,'lastError',last_error,
   'createdAt',created_at,'state',case when attempts>=5 then 'needs_attention'
     when attempts>0 then 'retrying' else 'queued' end
 ) order by created_at),'[]') from private.media_cleanup
$$;
create function public.thuraya_retry_media_cleanup(p_bucket text,p_path text,p_actor uuid)
returns boolean language plpgsql security definer set search_path='' as $$
declare actor_role text;
begin
 select role into actor_role from public.profiles where id=p_actor;
 if actor_role is null or actor_role not in('owner','admin','content_manager') then raise exception 'forbidden';end if;
 if p_bucket not in('product-media','review-media') or p_path is null or length(p_path) not between 1 and 512 then raise exception 'invalid_media';end if;
 if p_bucket='product-media' and exists(select 1 from public.media where storage_path=p_path) then raise exception 'media_in_use';end if;
 update private.media_cleanup set attempts=0,last_error=null,created_at=now()
 where bucket=p_bucket and path=p_path;
 if not found then raise exception 'cleanup_not_found';end if;
 insert into private.audit_log(actor,action,target,summary)
 values(p_actor::text,'retry_media_cleanup',p_bucket||':'||p_path,'Cleanup retry re-queued; no media record is attached');
 return true;
end $$;

-- Section ordering is only valid through the complete-list transaction.
-- Enabled customer-facing sections require AR/HE/EN fields; disabled drafts
-- remain editable while incomplete.
create function private.enforce_section_operational_contract() returns trigger
language plpgsql security definer set search_path='' as $$
declare lang text;
begin
 if TG_OP='UPDATE' and new.position is distinct from old.position
    and coalesce(current_setting('thuraya.section_reorder',true),'')<>'on' then
   raise exception 'use_section_reorder';
 end if;
 if new.enabled then
  foreach lang in array array['ar','he','en'] loop
   if length(trim(coalesce(new.title->>lang,'')))=0
      or length(trim(coalesce(new.body->>lang,'')))=0
      or length(trim(coalesce(new.cta->>lang,'')))=0 then
    raise exception 'translation_incomplete';
   end if;
  end loop;
 end if;
 return new;
end $$;
revoke all on function private.enforce_section_operational_contract() from public,anon,authenticated;
drop trigger if exists enforce_section_operational_contract on public.content_sections;
create trigger enforce_section_operational_contract before insert or update on public.content_sections
for each row execute function private.enforce_section_operational_contract();

create or replace function public.thuraya_reorder_sections(p_ids text[],p_actor uuid)
returns void language plpgsql security definer set search_path='' as $$
declare actor_role text;
begin
 select role into actor_role from public.profiles where id=p_actor;
 if actor_role is null or actor_role not in ('owner','admin','content_manager') then raise exception 'forbidden'; end if;
 lock table public.content_sections in share row exclusive mode;
 if cardinality(p_ids) is null or cardinality(p_ids)<>(select count(*) from public.content_sections)
 or cardinality(p_ids)<>(select count(distinct id) from unnest(p_ids) id)
 or exists(select 1 from unnest(p_ids) wanted(id) where not exists(select 1 from public.content_sections s where s.id=wanted.id))
 then raise exception 'stale_section_order'; end if;
 perform set_config('thuraya.section_reorder','on',true);
 update public.content_sections s set position=ordered.ordinality-1
 from unnest(p_ids) with ordinality ordered(id,ordinality) where s.id=ordered.id;
 insert into private.audit_log(actor,action,target,summary) values(p_actor::text,'reorder_sections','homepage','Section order updated');
end $$;

-- Acceptance reconciled by an operator is deliberately separate from an
-- authenticated provider receipt (delivered/read/bounced/etc.).
create function public.thuraya_reconciliation_projection() returns jsonb
language sql security definer set search_path='' as $$
 select coalesce(jsonb_agg(jsonb_build_object(
   'id',target,'acceptanceEvidence','operator_attestation','acceptanceAt',at
 )),'[]')
 from (
  select distinct on (target) target,at from private.audit_log
  where action='notification_reconciled'
  order by target,at desc
 ) reconciliation
$$;

revoke execute on function public.thuraya_collect_media_orphans(),public.thuraya_media_cleanup_status(),public.thuraya_retry_media_cleanup(text,text,uuid),public.thuraya_reconciliation_projection(),public.thuraya_reorder_sections(text[],uuid) from public,anon,authenticated;
grant execute on function public.thuraya_collect_media_orphans(),public.thuraya_media_cleanup_status(),public.thuraya_retry_media_cleanup(text,text,uuid),public.thuraya_reconciliation_projection(),public.thuraya_reorder_sections(text[],uuid) to service_role;
commit;
