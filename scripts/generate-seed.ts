import {writeFile} from 'node:fs/promises';
import {initialData} from '../src/seed.ts';
const d=initialData(false);const sql=['-- Production-safe bootstrap. All supplied products are DRAFT; no demo prices, accounts or reviews.','begin;'];
const literal=(v:unknown)=>`'${JSON.stringify(v).replaceAll("'","''")}'::jsonb`;
const snake=(v:Record<string,unknown>)=>Object.fromEntries(Object.entries(v).map(([k,x])=>[k.replace(/[A-Z]/g,c=>'_'+c.toLowerCase()),x]));
const upsert=(table:string,v:object)=>sql.push(`select private.upsert_row('public','${table}',${literal(v)});`);
for(const c of d.categories)upsert('categories',c);for(const c of d.collections)upsert('collections',c);
for(const m of d.media)upsert('media',snake(m as unknown as Record<string,unknown>));
for(const s of d.sections)upsert('content_sections',s);for(const p of d.pages)upsert('content_pages',snake(p as unknown as Record<string,unknown>));
sql.push(`insert into public.store_settings(id,config) values(true,${literal(d.settings)}) on conflict(id) do nothing;`);
for(const p of d.products){upsert('products',{id:p.id,sku:p.sku,slug:p.slug,status:'draft',category_id:p.categoryId,base_price:null,gem:{},metal:{},measurements:{}});for(const locale of ['ar','he','en'] as const)sql.push(`insert into public.product_translations(product_id,locale,name) values('${p.id}','${locale}','${p.name[locale].replaceAll("'","''")}') on conflict do nothing;`);for(const [position,m] of p.media.entries())sql.push(`insert into public.product_media values('${p.id}','${m.id}',${position}) on conflict do nothing;`)}
sql.push('commit;');await writeFile('supabase/seed.sql',sql.join('\n')+'\n');console.log('Safe seed generated: 7 draft products; no fake commerce data.');
