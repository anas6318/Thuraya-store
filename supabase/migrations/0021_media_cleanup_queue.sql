begin;
-- Queue object cleanup only after the relational reference is gone. This makes
-- an external Storage failure recoverable without restoring or breaking media.
create function public.thuraya_queue_media_cleanup(p_bucket text,p_path text) returns boolean language plpgsql security definer set search_path='' as $$begin
 if p_bucket not in('product-media','review-media') or p_path is null or length(p_path)<1 or length(p_path)>512 then raise exception 'invalid_media';end if;
 if exists(select 1 from public.media where storage_path=p_path) then raise exception 'media_in_use';end if;
 insert into private.media_cleanup(bucket,path) values(p_bucket,p_path) on conflict do nothing;
 return true;
end$$;
revoke execute on function public.thuraya_queue_media_cleanup(text,text) from public,anon,authenticated;
grant execute on function public.thuraya_queue_media_cleanup(text,text) to service_role;
commit;
