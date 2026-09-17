begin;
-- Preserve incomplete historical zones as drafts; never invent their translations.
update public.shipping_zones set active=false where active and
 (country<>'IL' or coalesce(btrim(name->>'ar'),'')='' or coalesce(btrim(name->>'he'),'')='' or coalesce(btrim(name->>'en'),'')='');
alter table public.shipping_zones add constraint shipping_launch_publication check
 (not active or (country='IL' and coalesce(btrim(name->>'ar'),'')<>'' and coalesce(btrim(name->>'he'),'')<>'' and coalesce(btrim(name->>'en'),'')<>''));
alter table public.shipping_zones add constraint shipping_eta_bounds check
 (eta_min<=365 and eta_max<=365) not valid;
commit;
