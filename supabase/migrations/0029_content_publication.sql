begin;
create function private.content_translation_complete(copy jsonb) returns boolean
language sql immutable set search_path='' as $$
 select coalesce(jsonb_typeof(copy)='object' and
 jsonb_typeof(copy->'ar')='string' and length(btrim(copy->>'ar'))>0 and
 jsonb_typeof(copy->'he')='string' and length(btrim(copy->>'he'))>0 and
 jsonb_typeof(copy->'en')='string' and length(btrim(copy->>'en'))>0,false)
$$;
revoke all on function private.content_translation_complete(jsonb) from public,anon,authenticated;
update public.content_pages set status='draft' where status='published' and
 (not private.content_translation_complete(title) or not private.content_translation_complete(body));
alter table public.content_pages add constraint content_launch_translation check
 (status<>'published' or (private.content_translation_complete(title) and private.content_translation_complete(body)));
commit;
