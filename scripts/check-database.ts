import {productSchema} from '../shared/product-schema';
import {adminMutation} from '../shared/admin-mutation';
import {shippingZoneSchema} from '../shared/shipping';
import {PGlite} from '@electric-sql/pglite';
import assert from 'node:assert/strict';
import {initialData} from '../src/seed.ts';
import {readFile,readdir} from 'node:fs/promises';
const db=new PGlite();
await db.exec(`create role anon; create role authenticated; create role service_role bypassrls; create schema auth; create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb); create function auth.uid() returns uuid language sql as $$select null::uuid$$; create schema storage; create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]); create table storage.objects(id uuid primary key,bucket_id text,name text);`);
for(const file of (await readdir('supabase/migrations')).sort()){let sql=await readFile(`supabase/migrations/${file}`,'utf8');sql=sql.replace('create extension if not exists pgcrypto;',''); // PGlite harness only: no pgcrypto extension; UUID built into Postgres.
if(file==='0001_schema.sql')sql=sql.replace("upper(encode(gen_random_bytes(8),'hex'))","upper(replace(gen_random_uuid()::text,'-',''))");
try{await db.exec(sql);console.log(`PASS ${file}`)}catch(e){console.error(`FAIL ${file}`,e);process.exitCode=1;break}}
if(!process.exitCode){
let count=0;
const check=async(name:string,fn:()=>Promise<void>)=>{await fn();count++;console.log(`PASS ${name}`)};
const owner='00000000-0000-4000-8000-000000000001';
await db.query("insert into auth.users values($1,'test@example.test','{}')",[owner]);await db.query("update public.profiles set role='owner' where id=$1",[owner]);
const seed=initialData(true);seed.settings.paymentMethods[0].enabled=true;
// This harness deliberately enables one transactional template to prove that
// account marketing preferences never suppress required order notices.
seed.settings.emailEnabled=true;
for(const template of seed.settings.templates)if(template.id==='in_production-email')template.enabled=true;
await db.query('insert into public.store_settings values(true,$1)',[JSON.stringify(seed.settings)]);
for(const c of seed.categories)await db.query('insert into public.categories(id,slug,name,description) values($1,$2,$3,$4)',[c.id,c.slug,JSON.stringify(c.name),JSON.stringify(c.description)]);
for(const c of seed.collections)await db.query('insert into public.collections(id,slug,name,description) values($1,$2,$3,$4)',[c.id,c.slug,JSON.stringify(c.name),JSON.stringify(c.description)]);
const p=seed.products.find(x=>x.isDemo)!;p.isDemo=false;
await check('normalized product write',async()=>{await db.query('select public.thuraya_save_product($1,$2)',[JSON.stringify(p),owner]);const r=await db.query<{count:number}>('select count(*)::int as count from public.variant_options');assert.equal(r.rows[0].count,2)});
await db.query("insert into public.shipping_zones(id,name,price,eta_min,eta_max,active) values('test','{\"ar\":\"منطقة\",\"he\":\"אזור\",\"en\":\"Zone\"}',3500,10,14,true)");
await check('shipping publication and lifecycle remain database enforced',async()=>{
await assert.rejects(db.query("update public.shipping_zones set name='{}' where id='test'"));
await assert.rejects(db.query("update public.shipping_zones set country='US' where id='test'"));
await assert.rejects(db.query("update public.shipping_zones set eta_max=9 where id='test'"));
await db.query("insert into public.shipping_zones(id,name,price,eta_min,eta_max,active) values('draft-zone','{}',0,10,14,false)");
await assert.rejects(db.query("update public.shipping_zones set active=true where id='draft-zone'"));
await db.query("update public.shipping_zones set active=false where id='test'");
await db.query("update public.shipping_zones set active=true where id='test'");
});
const input={idempotencyKey:'00000000-0000-4000-8000-000000000002',locale:'he',firstName:'Test',lastName:'Customer',email:'buyer@example.test',phone:'0501234567',country:'IL',city:'Test',street:'Test 10',postalCode:'',notes:'',giftNote:'',marketingConsent:false,whatsappUpdates:false,zoneId:'test',paymentMethod:'bank_transfer',discountCode:'',lines:[{productId:p.id,variantId:p.variants[0].id,quantity:2}]};
let order:{id:string;number:string;total:number};
await check('order recomputes total atomically',async()=>{const r=await db.query<{o:typeof order}>('select public.thuraya_place_order($1,$2,$3,$4) as o',[JSON.stringify(input),'emailhash','phonehash','requesthash']);order=r.rows[0].o;assert.equal(order.total,79500)});
await check('retry returns same order',async()=>{const r=await db.query<{o:typeof order}>('select public.thuraya_place_order($1,$2,$3,$4) as o',[JSON.stringify(input),'emailhash','phonehash','requesthash']);assert.equal(r.rows[0].o.id,order.id)});
await check('changed retry rejected',async()=>{await assert.rejects(db.query('select public.thuraya_place_order($1,$2,$3,$4)',[JSON.stringify(input),'emailhash','phonehash','changed']))});
await check('outbox committed with order',async()=>{const r=await db.query<{count:number}>("select count(*)::int as count from private.notification_outbox where order_id=$1",[order.id]);assert.equal(r.rows[0].count,3)});
await check('invalid contact reveals no order',async()=>{const r=await db.query<{o:unknown}>('select public.thuraya_track($1,$2) as o',[order.number,'wrong']);assert.equal(r.rows[0].o,null)});
await check('valid tracking excludes customer and supplier',async()=>{const r=await db.query<{o:Record<string,unknown>}>('select public.thuraya_track($1,$2) as o',[order.number,'emailhash']);assert.equal('customer' in r.rows[0].o,false);assert.equal('supplierReference' in r.rows[0].o,false)});
await check('manual payment transition',async()=>{await db.query("select public.thuraya_change_order($1,'payment_confirmed',$2)",[order.id,owner])});
await check('skipped production rejected',async()=>{await assert.rejects(db.query("select public.thuraya_change_order($1,'shipped',$2)",[order.id,owner]))});
await check('anonymous private data denied',async()=>{await db.exec('set role anon');await assert.rejects(db.query('select * from private.order_contacts'));await db.exec('reset role')});
await check('anonymous order mutation denied',async()=>{await db.exec('set role anon');await assert.rejects(db.query("select public.thuraya_change_order($1,'in_production',$2)",[order.id,owner]));await db.exec('reset role')});
await check('RLS hides draft products',async()=>{await db.query("update public.products set status='draft' where id=$1",[p.id]);await db.exec('set role anon');const r=await db.query('select * from public.products');assert.equal(r.rows.length,0);await db.exec('reset role')});
await check('unconfirmed uploads cannot be attached',async()=>{await db.query("insert into private.upload_tickets(path,actor,mime,bytes) values('test/image.jpg',$1,'image/jpeg',100)",[owner]);const r=await db.query<{ok:boolean}>("select public.thuraya_media_confirmed('test/image.jpg') ok");assert.equal(r.rows[0].ok,false);await db.exec("update private.upload_tickets set confirmed=true where path='test/image.jpg'");const confirmed=await db.query<{ok:boolean}>("select public.thuraya_media_confirmed('test/image.jpg') ok");assert.equal(confirmed.rows[0].ok,true)});
await check('CMS media cannot be deleted while referenced',async()=>{await db.exec("insert into public.media(id,src,alt,kind,width,height,mime) values('cms-test','/test.jpg','{}','image',10,10,'image/jpeg'); update public.categories set image='/test.jpg' where id='rings'");await assert.rejects(db.exec("delete from public.media where id='cms-test'"));await db.exec("update public.categories set image='' where id='rings'; delete from public.media where id='cms-test'")});
await check('notification claims do not double claim locked events',async()=>{await db.exec("update private.notification_outbox set status='pending',attempts=0,locked_at=null,next_attempt_at=null");const first=await db.query<{items:unknown[]}>('select public.thuraya_claim_notifications() items');assert.ok(first.rows[0].items.length>0);const second=await db.query<{items:unknown[]}>('select public.thuraya_claim_notifications() items');assert.equal(second.rows[0].items.length,0)});
await check('safe failed email retries once due',async()=>{await db.exec("update private.notification_outbox set status='failed',locked_at=null,next_attempt_at=now()-interval '1 second' where channel='email'");const r=await db.query<{items:{channel:string;attempts:number}[]}>('select public.thuraya_claim_notifications() items');assert.ok(r.rows[0].items.length>0);assert.ok(r.rows[0].items.every(n=>n.channel==='email'&&n.attempts===2))});
await check('ambiguous WhatsApp and expired email remain held',async()=>{await db.exec("update private.notification_outbox set locked_at=now()-interval '10 minutes' where channel='whatsapp'; update private.notification_outbox set first_attempt_at=now()-interval '24 hours' where channel='email'");const r=await db.query<{items:unknown[]}>('select public.thuraya_claim_notifications() items');assert.equal(r.rows[0].items.length,0);const held=await db.query<{n:number}>("select count(*)::int n from private.notification_outbox where uncertain and status='failed'");assert.ok(held.rows[0].n>0)});
await check('direct review API cannot expose customer IDs or draft products',async()=>{await db.query("insert into public.reviews(product_id,customer_id,name,rating,status) values($1,$2,'Test',5,'approved')",[p.id,owner]);await db.exec('set role anon');await assert.rejects(db.query('select customer_id from public.reviews'));const draft=await db.query('select id,name,rating from public.reviews');assert.equal(draft.rows.length,0);await db.exec('reset role');await db.query("update public.products set status='published' where id=$1",[p.id]);await db.exec('set role anon');const published=await db.query('select id,name,rating from public.reviews');assert.equal(published.rows.length,1);await db.exec('reset role')});
let reviewId='';
await check('review photo capabilities bind uploads to pending reviews',async()=>{const r=await db.query<{id:string}>('select public.thuraya_create_review($1,$2,$3,false) id',[JSON.stringify({productId:p.id,name:'Photo reviewer',rating:5,text:'Review'}),'capability',owner]);reviewId=r.rows[0].id;await assert.rejects(db.query("select public.thuraya_review_upload($1,'wrong','reserve',$2,'image/jpeg',100)",[reviewId,reviewId+'/x.jpg']));await db.query("select public.thuraya_review_upload($1,'capability','reserve',$2,'image/jpeg',100)",[reviewId,reviewId+'/x.jpg']);await db.query("select public.thuraya_review_upload($1,'capability','confirm',$2)",[reviewId,reviewId+'/x.jpg']);await db.query("select public.thuraya_review_upload($1,'capability','confirm',$2)",[reviewId,reviewId+'/x.jpg']);const a=await db.query<{n:number}>('select cardinality(media) n from public.reviews where id=$1',[reviewId]);assert.equal(a.rows[0].n,1)});
await check('review images stay private until moderation and become private when hidden',async()=>{const path=reviewId+'/x.jpg';const visible=async()=>(await db.query<{mime:string|null}>('select public.thuraya_public_review_media($1) mime',[path])).rows[0].mime;assert.equal(await visible(),null);await db.query("update public.reviews set status='approved' where id=$1",[reviewId]);assert.equal(await visible(),'image/jpeg');await assert.rejects(db.query("select public.thuraya_review_upload($1,'capability','reserve',$2,'image/jpeg',100)",[reviewId,reviewId+'/late.jpg']));await db.query("update public.reviews set status='hidden' where id=$1",[reviewId]);assert.equal(await visible(),null)});
await check('review photo reservation is bounded to three',async()=>{await db.query("update public.reviews set status='pending' where id=$1",[reviewId]);for(const file of ['two.jpg','three.jpg'])await db.query("select public.thuraya_review_upload($1,'capability','reserve',$2,'image/jpeg',100)",[reviewId,reviewId+'/'+file]);await assert.rejects(db.query("select public.thuraya_review_upload($1,'capability','reserve',$2,'image/jpeg',100)",[reviewId,reviewId+'/four.jpg']))});
await check('orphan cleanup cannot delete an attached upload ticket',async()=>{await db.exec("update private.upload_tickets set created_at=now()-interval '3 days' where path='test/image.jpg'; insert into public.media(id,src,storage_path,alt,kind,width,height,mime) values('pinned','/pin.jpg','test/image.jpg','{}','image',10,10,'image/jpeg')");await assert.rejects(db.exec("delete from private.upload_tickets where path='test/image.jpg'"));await db.query('select public.thuraya_collect_media_orphans()');let rows=await db.query("select * from private.media_cleanup where path='test/image.jpg'");assert.equal(rows.rows.length,0);await db.exec("delete from public.media where id='pinned'");await db.query('select public.thuraya_collect_media_orphans()');rows=await db.query("select * from private.media_cleanup where path='test/image.jpg'");assert.equal(rows.rows.length,1);await db.exec("select public.thuraya_cleanup_result('product-media','test/image.jpg',false)");const retry=await db.query<{attempts:number}>("select attempts from private.media_cleanup where path='test/image.jpg'");assert.equal(retry.rows[0].attempts,1)});
await check('media cleanup queues only detached storage paths',async()=>{await db.query("insert into private.upload_tickets(path,actor,mime,bytes,confirmed) values('queue/image.jpg',$1,'image/jpeg',100,true)",[owner]);await db.exec("insert into public.media(id,src,storage_path,alt,kind,width,height,mime) values('queue-pinned','/queue.jpg','queue/image.jpg','{}','image',10,10,'image/jpeg')");await assert.rejects(db.exec("select public.thuraya_queue_media_cleanup('product-media','queue/image.jpg')"));await db.exec("delete from public.media where id='queue-pinned'");const queued=await db.query<{thuraya_queue_media_cleanup:boolean}>("select public.thuraya_queue_media_cleanup('product-media','queue/image.jpg')");assert.equal(queued.rows[0].thuraya_queue_media_cleanup,true);const jobs=await db.query("select * from private.media_cleanup where bucket='product-media' and path='queue/image.jpg'");assert.equal(jobs.rows.length,1)});
await check('queued cleanup paths cannot be reattached and can be safely re-queued by media staff',async()=>{await assert.rejects(db.exec("insert into public.media(id,src,storage_path,alt,kind,width,height,mime) values('queue-reuse','/queue-reuse.jpg','queue/image.jpg','{}','image',10,10,'image/jpeg')"));await db.exec("update private.media_cleanup set attempts=5,last_error='Storage deletion failed' where bucket='product-media' and path='queue/image.jpg'");const status=await db.query<{jobs:{state:string;attempts:number}[]}>('select public.thuraya_media_cleanup_status() jobs');assert.equal(status.rows[0].jobs.find(j=>j.state==='needs_attention')?.attempts,5);await db.query("select public.thuraya_retry_media_cleanup('product-media','queue/image.jpg',$1)",[owner]);const retry=await db.query<{attempts:number;last_error:string|null}>("select attempts,last_error from private.media_cleanup where bucket='product-media' and path='queue/image.jpg'");assert.equal(retry.rows[0].attempts,0);assert.equal(retry.rows[0].last_error,null);await assert.rejects(db.query("select public.thuraya_retry_media_cleanup('product-media','queue/image.jpg',$1)",['00000000-0000-4000-8000-000000000099']))});
await check('addresses are owner-scoped, retain one default and safely promote on deletion',async()=>{const customer='00000000-0000-4000-8000-000000000010';const other='00000000-0000-4000-8000-000000000011';for(const user of [customer,other])await db.query("insert into auth.users values($1,$2,'{}')",[user,user+'@example.test']);const address=(id:string,is_default=false)=>JSON.stringify({id,first_name:'A',last_name:'B',phone:'0501234567',city:'Nazareth',street:'Main 1',postal_code:'',country:'IL',is_default});await db.query('select public.thuraya_save_address($1,$2)',[customer,address('address-a')]);let rows=await db.query<{id:string;is_default:boolean}>('select id,is_default from public.addresses where customer_id=$1 order by id',[customer]);assert.deepEqual(rows.rows,[{id:'address-a',is_default:true}]);await db.query('select public.thuraya_save_address($1,$2)',[customer,address('address-b')]);await db.query('select public.thuraya_save_address($1,$2)',[customer,address('address-b',true)]);rows=await db.query('select id,is_default from public.addresses where customer_id=$1 order by id',[customer]);assert.deepEqual(rows.rows,[{id:'address-a',is_default:false},{id:'address-b',is_default:true}]);await assert.rejects(db.query('select public.thuraya_save_address($1,$2)',[other,address('address-b',true)]));const removed=await db.query<{r:{defaultId:string}}> ('select public.thuraya_delete_address($1,$2) r',[customer,'address-b']);assert.equal(removed.rows[0].r.defaultId,'address-a');rows=await db.query('select id,is_default from public.addresses where customer_id=$1',[customer]);assert.deepEqual(rows.rows,[{id:'address-a',is_default:true}]);await db.query('select public.thuraya_delete_address($1,$2)',[customer,'address-a']);const none=await db.query('select * from public.addresses where customer_id=$1',[customer]);assert.equal(none.rows.length,0)});
await check('checkout consent only adds account preferences and transactional email remains enabled',async()=>{const customer='00000000-0000-4000-8000-000000000010';await db.query("insert into public.orders(id,number,customer_id,locale,status,payment_status,payment_method,subtotal,discount,shipping,total,eta_min,eta_max) values('preference-order','TH-PREFERENCE',$1,'en','payment_pending','pending','bank_transfer',1,0,0,1,10,14)",[customer]);await db.query("insert into private.order_contacts(order_id,email_hash,phone_hash,customer) values('preference-order','email','phone',$1)",[JSON.stringify({marketingConsent:true,whatsappUpdates:true})]);const preference=await db.query<{marketing_consent:boolean;whatsapp_updates:boolean}>('select marketing_consent,whatsapp_updates from public.profiles where id=$1',[customer]);assert.equal(preference.rows[0].marketing_consent,true);assert.equal(preference.rows[0].whatsapp_updates,true);await db.query("update public.orders set customer_id=$1 where id=$2",[owner,order.id]);await db.query("update public.profiles set locale='ar',email_updates=false where id=$1",[owner]);await db.query("select public.thuraya_change_order($1,'in_production',$2)",[order.id,owner]);const rows=await db.query<{locale:string;status:string}>("select locale,status from private.notification_outbox where order_id=$1 and template_id='in_production-email' and audience='customer'",[order.id]);assert.equal(rows.rows.length,1);assert.equal(rows.rows[0].locale,'ar');assert.equal(rows.rows[0].status,'pending')});
await check('account removal preserves order and audit history while unlinking the profile',async()=>{const customer='00000000-0000-4000-8000-000000000012';await db.query("insert into auth.users values($1,'archived@example.test','{}')",[customer]);await db.query("insert into public.orders(id,number,customer_id,locale,status,payment_status,payment_method,subtotal,discount,shipping,total,eta_min,eta_max) values('history-order','TH-HISTORY',$1,'en','payment_pending','pending','bank_transfer',1,0,0,1,10,14)",[customer]);await db.query("insert into private.audit_log(actor,action,target,summary) values($1,'account_history','history-order','History retained')",[customer]);await db.query('delete from auth.users where id=$1',[customer]);const orderRow=await db.query<{customer_id:string|null}>('select customer_id from public.orders where id=$1',['history-order']);assert.equal(orderRow.rows[0].customer_id,null);const audit=await db.query('select * from private.audit_log where action=$1 and target=$2',['account_history','history-order']);assert.equal(audit.rows.length,1)});
await check('order managers can update fulfilment but cannot read or write supplier fields',async()=>{const manager='00000000-0000-4000-8000-000000000013';await db.query("insert into auth.users values($1,'orders@example.test','{}')",[manager]);await db.query("update public.profiles set role='order_manager' where id=$1",[manager]);await db.query("update private.order_contacts set internal_notes='Owner note',supplier_reference='Supplier only' where order_id=$1",[order.id]);await assert.rejects(db.query("select public.thuraya_private_write('order',$1,$2)",[JSON.stringify({id:order.id,internalNotes:'Attempt',supplierReference:'Attempt',safeTrackingUrl:null,etaMin:10,etaMax:14}),manager]));await db.query("select public.thuraya_private_write('order',$1,$2)",[JSON.stringify({id:order.id,safeTrackingUrl:'https://tracking.example.test/order',etaMin:11,etaMax:15}),manager]);const privateFields=await db.query<{internal_notes:string;supplier_reference:string}>('select internal_notes,supplier_reference from private.order_contacts where order_id=$1',[order.id]);assert.deepEqual(privateFields.rows[0],{internal_notes:'Owner note',supplier_reference:'Supplier only'});const fulfilment=await db.query<{eta_min:number;eta_max:number}>('select eta_min,eta_max from public.orders where id=$1',[order.id]);assert.deepEqual(fulfilment.rows[0],{eta_min:11,eta_max:15})});
await check('homepage section reorder is atomic and rejects stale or unauthorized requests',async()=>{for(const section of seed.sections)await db.query("select public.thuraya_admin_write('sections',$1,$2)",[JSON.stringify(section),owner]);const ids=seed.sections.map(s=>s.id).reverse();await db.query('select public.thuraya_reorder_sections($1,$2)',[ids,owner]);const readOrder=async()=>(await db.query<{id:string}>('select id from public.content_sections order by position')).rows.map(r=>r.id);assert.deepEqual(await readOrder(),ids);await assert.rejects(db.query('select public.thuraya_reorder_sections($1,$2)',[[...ids.slice(1),'foreign'],owner]));assert.deepEqual(await readOrder(),ids);await assert.rejects(db.query('select public.thuraya_reorder_sections($1,$2)',[ids,'00000000-0000-4000-8000-000000000099']));assert.deepEqual(await readOrder(),ids)});
await check('enabled sections require complete translations and reject direct position mutation',async()=>{const sid=seed.sections[0].id;await assert.rejects(db.query("update public.content_sections set position=99 where id=$1",[sid]));await db.query("update public.content_sections set enabled=false where id=$1",[sid]);await db.query("update public.content_sections set title=jsonb_set(title,'{ar}','\"\"') where id=$1",[sid]);await assert.rejects(db.query("update public.content_sections set enabled=true where id=$1",[sid]));await db.query("update public.content_sections set title=jsonb_set(title,'{ar}','\"عنوان\"'),enabled=true where id=$1",[sid])});
await check('taxonomy ordering is atomic, append-only on create and rejects direct position mutation',async()=>{const before=(await db.query<{id:string}>('select id from public.categories order by position')).rows.map(row=>row.id);const ids=[...before].reverse();await db.query('select public.thuraya_reorder_taxonomy($1,$2,$3)',['categories',ids,owner]);const after=(await db.query<{id:string}>('select id from public.categories order by position')).rows.map(row=>row.id);assert.deepEqual(after,ids);await assert.rejects(db.query("update public.categories set position=99 where id=$1",[ids[0]]));await assert.rejects(db.query('select public.thuraya_reorder_taxonomy($1,$2,$3)',['categories',[...ids.slice(1),'foreign'],owner]));await db.exec("insert into public.categories(id,slug,name,description,image,position,active) values('appended','appended','{}','{}','',0,false)");const appended=(await db.query<{position:number}>("select position from public.categories where id='appended'")).rows[0];assert.equal(appended.position,ids.length)});
await check('admin audit records safe changed-field summaries without saved values',async()=>{const category=seed.categories[0];await db.query("select public.thuraya_admin_write('categories',$1,$2)",[JSON.stringify({...category,name:{ar:'ع',he:'ה',en:'Changed'},description:{ar:'a',he:'b',en:'Sensitive-looking value'}}),owner]);const audit=(await db.query<{summary:string}>("select summary from private.audit_log where action='save_categories' and target=$1 order by at desc limit 1",[category.id])).rows[0];assert.match(audit.summary,/Updated fields:.*name/);assert.equal(audit.summary.includes('Changed'),false);assert.equal(audit.summary.includes('Sensitive-looking value'),false)});
await check('CMS references reject foreign uploads and retain a relational deletion guard',async()=>{await db.exec("insert into public.media(id,src,alt,kind,width,height,mime) values('cms-fk','/media/cms-fk.jpg','{}','image',100,200,'image/jpeg')");const sid=seed.sections[0].id;await db.query('update public.content_sections set image=$1 where id=$2',['/media/cms-fk.jpg',sid]);let refs=await db.query("select * from private.cms_media_references where media_id='cms-fk'");assert.equal(refs.rows.length,1);await db.exec("update public.media set src='/media/replaced-source.jpg' where id='cms-fk'");await assert.rejects(db.exec("delete from public.media where id='cms-fk'"));await assert.rejects(db.query('update public.content_sections set image=$1 where id=$2',['https://untrusted.example/tracker.jpg',sid]));refs=await db.query("select * from private.cms_media_references where media_id='cms-fk'");assert.equal(refs.rows.length,1);await db.query("update public.content_sections set image='' where id=$1",[sid]);await db.exec("delete from public.media where id='cms-fk'")});
await check('CMS delivery follows replaced media identity and current visibility',async()=>{const sid=seed.sections[0].id;for(const path of ['replacement/old.jpg','replacement/new.jpg'])await db.query("insert into private.upload_tickets(path,actor,mime,bytes,confirmed) values($1,$2,'image/jpeg',100,true)",[path,owner]);await db.exec("insert into public.media(id,src,storage_path,alt,kind,width,height,mime) values('replacement','https://storage.test/replacement/old.jpg','replacement/old.jpg','{}','image',400,500,'image/jpeg')");await db.query("update public.content_sections set image='https://storage.test/replacement/old.jpg',enabled=true where id=$1",[sid]);await db.exec("update public.media set src='https://storage.test/replacement/new.jpg',storage_path='replacement/new.jpg',width=800,height=1000 where id='replacement'");await db.query('update public.content_sections set image=image where id=$1',[sid]);const media=await db.query<{m:{path:string}}>("select public.thuraya_public_product_media('replacement') m");assert.equal(media.rows[0].m.path,'replacement/new.jpg');const refs=await db.query<{r:{media:{id:string;width:number}}[]}>('select public.thuraya_cms_media() r');assert.equal(refs.rows[0].r.find(x=>x.media.id==='replacement')?.media.width,800);await db.query('update public.content_sections set enabled=false where id=$1',[sid]);const hidden=await db.query<{m:unknown}>("select public.thuraya_public_product_media('replacement') m");assert.equal(hidden.rows[0].m,null);await db.query('delete from public.content_sections where id=$1',[sid]);await db.exec("delete from public.media where id='replacement'")});
await check('notification acceptance requires a receipt and survives stale failure reports',async()=>{
 const n=(await db.query<{id:string}>('select id from private.notification_outbox order by id limit 1')).rows[0].id;
 const result=(status:string,receipt:string|null)=>db.query('select public.thuraya_notification_result($1,$2,$3,null)',[n,status,receipt]);
 await assert.rejects(result('sent',null));await assert.rejects(result('sent',' '));await assert.rejects(result('pending',null));
 await result('sent','accepted-1');
 const before=(await db.query<{n:number}>('select count(*)::int n from private.notification_logs where notification_id=$1',[n])).rows[0].n;
 await result('sent','accepted-1');await result('failed',null);await result('disabled',null);
 await assert.rejects(result('sent','conflicting-receipt'));
 const saved=(await db.query<{status:string;provider_id:string}>('select status,provider_id from private.notification_outbox where id=$1',[n])).rows[0];
 assert.equal(saved.status,'sent');assert.equal(saved.provider_id,'accepted-1');
 const after=(await db.query<{n:number}>('select count(*)::int n from private.notification_logs where notification_id=$1',[n])).rows[0].n;assert.equal(after,before);
});
await check('operator reconciliation is privileged audited idempotent and never resends',async()=>{
 const n=(await db.query<{id:string}>("select id from private.notification_outbox where status<>'sent' order by id limit 1")).rows[0].id;
 await db.query("update private.notification_outbox set status='failed',uncertain=true where id=$1",[n]);
 const reconcile=(receipt:string,actor=owner)=>db.query('select public.thuraya_reconcile_notification($1,$2,$3)',[n,receipt,actor]);
 await assert.rejects(reconcile('accepted-2','00000000-0000-4000-8000-000000000099'));
 await assert.rejects(reconcile('customer@example.test'));
 await reconcile('accepted-2');await reconcile('accepted-2');await assert.rejects(reconcile('different'));
 const audit=await db.query("select * from private.audit_log where action='notification_reconciled' and target=$1",[n]);assert.equal(audit.rows.length,1);
 const state=(await db.query<{status:string;uncertain:boolean;next_attempt_at:unknown}>('select status,uncertain,next_attempt_at from private.notification_outbox where id=$1',[n])).rows[0];assert.equal(state.status,'sent');assert.equal(state.uncertain,false);assert.equal(state.next_attempt_at,null);
 await db.exec('set role anon');await assert.rejects(reconcile('accepted-2'));await db.exec('reset role');
});
await check('operator acceptance remains distinct from authenticated delivery/read receipts',async()=>{const projection=await db.query<{rows:{id:string;acceptanceEvidence:string;acceptanceAt:string}[]}>('select public.thuraya_reconciliation_projection() rows');assert.ok(projection.rows[0].rows.some(row=>row.acceptanceEvidence==='operator_attestation'));const n=(await db.query<{id:string;provider_id:string;channel:string}>("select id,provider_id,channel from private.notification_outbox where status='sent' and provider_id='accepted-2' limit 1")).rows[0];await db.query("select public.thuraya_notification_receipt($1,'receipt-operator-distinct',$2,'delivered',now())",[n.channel==='email'?'resend':'meta',n.provider_id]);const receipts=await db.query<{rows:{id:string;receiptState:string}[]}>('select public.thuraya_receipt_projection() rows');assert.ok(receipts.rows[0].rows.some(row=>row.id===n.id&&row.receiptState==='delivered'))});
await check('expired review capability cannot confirm a reserved photo',async()=>{
 const r=(await db.query<{id:string}>('select public.thuraya_create_review($1,$2,$3,false) id',[JSON.stringify({productId:p.id,name:'Expiry check',rating:5,text:'Test'}),'expiry-token',owner])).rows[0].id;
 const path=r+'/expired.jpg';await db.query("select public.thuraya_review_upload($1,'expiry-token','reserve',$2,'image/jpeg',100)",[r,path]);
 await db.query("update private.review_sessions set expires_at=now()-interval '1 second' where review_id=$1",[r]);
 await assert.rejects(db.query("select public.thuraya_review_upload($1,'expiry-token','confirm',$2)",[r,path]));
 await db.query("update public.reviews set status='approved' where id=$1",[r]);
 const visible=(await db.query<{mime:string|null}>('select public.thuraya_public_review_media($1) mime',[path])).rows[0].mime;assert.equal(visible,null);
});
await check('approved review photo is revoked when product becomes draft and retains reference protection',async()=>{
 const path=reviewId+'/x.jpg';await db.query("update public.reviews set status='approved' where id=$1",[reviewId]);
 await db.query("update public.products set status='draft' where id=$1",[p.id]);
 const visible=await db.query<{mime:string|null}>('select public.thuraya_public_review_media($1) mime',[path]);assert.equal(visible.rows[0].mime,null);
 await assert.rejects(db.query('delete from public.reviews where id=$1',[reviewId]));
 await db.query("update public.products set status='published' where id=$1",[p.id]);
});
const paymentEvent=(event:string,outcome:string,amount=order.total,currency='ILS',provider='bank_transfer')=>db.query<{result:{duplicate?:boolean}}>('select public.thuraya_payment_event($1,$2,$3,$4,$5,$6) result',[provider,event,order.id,amount,currency,outcome]);
await check('payment events deduplicate and reject conflicting reuse',async()=>{
 await paymentEvent('paid-1','paid');
 assert.equal((await paymentEvent('paid-1','paid')).rows[0].result.duplicate,true);
 await assert.rejects(paymentEvent('paid-1','failed'));
});
await check('payment events reject wrong provider amount currency and outcome',async()=>{
 await assert.rejects(paymentEvent('bad-provider','paid',order.total,'ILS','card'));
 await assert.rejects(paymentEvent('bad-amount','paid',order.total-1));
 await assert.rejects(paymentEvent('bad-currency','paid',order.total,'USD'));
 await assert.rejects(paymentEvent('bad-outcome','success'));
 const rejected=await db.query("select * from private.payment_events where event_id like 'bad-%'");assert.equal(rejected.rows.length,0);
});
await check('full refunds are idempotent and late events cannot revive a refunded payment',async()=>{
 await paymentEvent('refund-1','refunded');
 assert.equal((await paymentEvent('refund-1','refunded')).rows[0].result.duplicate,true);
 for(const outcome of ['paid','pending','failed'])await paymentEvent('late-'+outcome,outcome);
 const state=await db.query<{payment_status:string}>('select payment_status from public.orders where id=$1',[order.id]);assert.equal(state.rows[0].payment_status,'refunded');
 await assert.rejects(paymentEvent('partial-refund','refunded',order.total-1));
});
await check('stale notification attempts cannot change newer claims or payloads',async()=>{
 const id=(await db.query<{id:string}>('select id from private.notification_outbox order by id limit 1')).rows[0].id;
 await db.query("update private.notification_outbox set status='pending',attempts=3,locked_at=now(),uncertain=false where id=$1",[id]);
 const before=(await db.query('select * from private.notification_outbox where id=$1',[id])).rows[0];
 for(const state of ['failed','disabled','sent']){
  const r=await db.query<{ok:boolean}>('select public.thuraya_attempt_result($1,2,$2,$3,null) ok',[id,state,state==='sent'?'stale-id':null]);assert.equal(r.rows[0].ok,false);
 }
 await assert.rejects(db.query("select public.thuraya_attempt_payload($1,2,'{}')",[id]));
 assert.deepEqual((await db.query('select * from private.notification_outbox where id=$1',[id])).rows[0],before);
});
await check('duplicate completion and late failures do not duplicate logs or regress acceptance',async()=>{
 const id=(await db.query<{id:string}>('select id from private.notification_outbox order by id limit 1')).rows[0].id;
 const finish=(attempt:number,state:string,receipt:string|null)=>db.query<{ok:boolean}>('select public.thuraya_attempt_result($1,$2,$3,$4,null) ok',[id,attempt,state,receipt]);
 assert.equal((await finish(3,'failed',null)).rows[0].ok,true);
 assert.equal((await finish(3,'failed',null)).rows[0].ok,false);
 await db.query("update private.notification_outbox set status='pending',attempts=4,locked_at=now() where id=$1",[id]);
 assert.equal((await finish(4,'sent','current-id')).rows[0].ok,true);
 const count=(await db.query<{n:number}>('select count(*)::int n from private.notification_logs where notification_id=$1',[id])).rows[0].n;
 for(const attempt of [3,4])for(const state of ['sent','failed'])assert.equal((await finish(attempt,state,state==='sent'?'current-id':null)).rows[0].ok,false);
 assert.equal((await db.query<{n:number}>('select count(*)::int n from private.notification_logs where notification_id=$1',[id])).rows[0].n,count);
 assert.equal((await db.query<{status:string}>('select status from private.notification_outbox where id=$1',[id])).rows[0].status,'sent');
});
await check('service worker cannot bypass attempt-aware notification APIs',async()=>{
 await db.exec('set role service_role');
 await assert.rejects(db.query("select public.thuraya_notification_result('unknown','sent','id',null)"));
 await assert.rejects(db.query("select public.thuraya_notification_payload('unknown','{}')"));
 await db.exec('reset role');
});
await check('receipt ingestion is idempotent and rejects conflicting event reuse',async()=>{
 const at='2024-11-15T20:00:00Z';const add=(state:string)=>db.query<{ok:boolean}>("select public.thuraya_notification_receipt('resend','receipt-1','receipt-message',$1,$2) ok",[state,at]);
 assert.equal((await add('accepted')).rows[0].ok,true);assert.equal((await add('accepted')).rows[0].ok,false);await assert.rejects(add('failed'));
});
await check('early and out-of-order receipts project monotonically without altering send state',async()=>{
 const id=(await db.query<{id:string}>("select id from private.notification_outbox where channel='email' and provider_id is null order by id limit 1")).rows[0].id;
 const projection=async()=>(await db.query<{r:{id:string;receiptState:string;receiptAlert:string|null}[]}>('select public.thuraya_receipt_projection() r')).rows[0].r.find(r=>r.id===id);
 assert.equal(await projection(),undefined);
 await db.query("update private.notification_outbox set status='sent',provider_id='receipt-message' where id=$1",[id]);
 assert.equal((await projection())?.receiptState,'accepted');
 await db.query("select public.thuraya_notification_receipt('resend','receipt-2','receipt-message','delivered','2024-11-15T20:01:00Z')");
 await db.query("select public.thuraya_notification_receipt('resend','receipt-3','receipt-message','failed','2024-11-15T20:02:00Z')");
 assert.equal((await projection())?.receiptState,'delivered');assert.equal((await projection())?.receiptAlert,'failed');
 assert.equal((await db.query<{status:string}>('select status from private.notification_outbox where id=$1',[id])).rows[0].status,'sent');
 await assert.rejects(db.query("select public.thuraya_notification_receipt('resend','fake-read','receipt-message','read',now())"));
});
await check('receipt storage supports read monotonicity but is never publicly writable',async()=>{
 await db.query("select public.thuraya_notification_receipt('meta','meta-read','meta-message','read','2024-11-15T20:02:00Z')");
 await db.query("select public.thuraya_notification_receipt('meta','meta-delivered','meta-message','delivered','2024-11-15T20:01:00Z')");
 const id=(await db.query<{id:string}>("select id from private.notification_outbox where channel='whatsapp' order by id limit 1")).rows[0].id;
 await db.query("update private.notification_outbox set provider_id='meta-message' where id=$1",[id]);
 const r=await db.query<{r:{id:string;receiptState:string}[]}>('select public.thuraya_receipt_projection() r');assert.equal(r.rows[0].r.find(n=>n.id===id)?.receiptState,'read');
 await db.exec('set role anon');await assert.rejects(db.query('select * from private.notification_receipts'));await assert.rejects(db.query("select public.thuraya_notification_receipt('meta','forged','meta-message','read',now())"));await db.exec('reset role');
});
await check('promotion identity and admin authorization fail closed',async()=>{
await db.exec('begin');try{
await db.query("insert into private.discounts(id,code,kind,value) values('case-test','SAVE','fixed',100)");
await db.exec('savepoint duplicate_code');await assert.rejects(db.query("insert into private.discounts(id,code,kind,value) values('case-other','save','fixed',100)"));await db.exec('rollback to duplicate_code');
await db.exec('savepoint missing_actor');await assert.rejects(db.query("select public.thuraya_admin_write('discounts',$1,$2)",[JSON.stringify({id:'case-test',active:true}),'00000000-0000-4000-8000-999999999999']));await db.exec('rollback to missing_actor');
}finally{await db.exec('rollback')}
});
await check('coupon redemption remains atomic, single-use and retry-idempotent',async()=>{
await db.exec('begin');try{
await db.query("insert into private.discounts(id,code,kind,value,active,usage_limit) values('redemption-test','ONCE','fixed',999999,true,1)");
const checkout={...input,idempotencyKey:'00000000-0000-4000-8000-000000000101',discountCode:'once'};
const args=[JSON.stringify(checkout),'eh','ph','coupon-request'];
const first=await db.query<{o:{id:string;total:number;shipping:number;discount:number;subtotal:number}}>('select public.thuraya_place_order($1,$2,$3,$4) as o',args);
assert.equal(first.rows[0].o.discount,first.rows[0].o.subtotal);assert.equal(first.rows[0].o.total,first.rows[0].o.shipping);
const retry=await db.query<{o:{id:string}}>('select public.thuraya_place_order($1,$2,$3,$4) as o',args);assert.equal(retry.rows[0].o.id,first.rows[0].o.id);
const used=await db.query<{used:number}>("select used from private.discounts where id='redemption-test'");assert.equal(used.rows[0].used,1);
const redeemed=await db.query<{n:number}>("select count(*)::int n from private.discount_redemptions where discount_id='redemption-test'");assert.equal(redeemed.rows[0].n,1);
await db.exec('savepoint exhausted');await assert.rejects(db.query('select public.thuraya_place_order($1,$2,$3,$4)',[JSON.stringify({...checkout,idempotencyKey:'00000000-0000-4000-8000-000000000102'}),'eh','ph','other-coupon-request']));await db.exec('rollback to exhausted');
}finally{await db.exec('rollback')}
});
await check('published CMS pages cannot bypass launch-language parity',async()=>{
await db.query("insert into public.content_pages(id,slug,kind,title,body,status) values('partial-page','partial-page','education','{}','{}','draft')");
await assert.rejects(db.query("update public.content_pages set status='published' where id='partial-page'"));
const copy={ar:'عربي',he:'עברית',en:'English'};
await db.query("update public.content_pages set title=$1,body=$1,status='published' where id='partial-page'",[JSON.stringify(copy)]);
await assert.rejects(db.query("update public.content_pages set body='{}' where id='partial-page'"));
await db.query("update public.content_pages set status='draft' where id='partial-page'");
});
await check('actual database shipping snapshot round-trips through strict Admin editing',async()=>{
const snapshot=await db.query<{d:{zones:Record<string,unknown>[]}}>('select public.thuraya_snapshot(true) as d');
const zone=snapshot.rows[0].d.zones.find(z=>z.id==='test')!;assert.equal('eta_min' in zone,true);
const edit=shippingZoneSchema.parse(adminMutation('zones',zone));
const {etaMin,etaMax,...rest}=edit;
await db.query("select public.thuraya_admin_write('zones',$1,$2)",[JSON.stringify({...rest,eta_min:etaMin,eta_max:etaMax}),owner]);
});
await check('database product media and option values round-trip through strict editing',async()=>{
const snapshot=await db.query<{d:{products:{id:string}[]}}>('select public.thuraya_snapshot(true) as d');
const product=snapshot.rows[0].d.products.find(row=>row.id===p.id)!;
productSchema.parse(adminMutation('products',product));
const publicSnapshot=await db.query<{d:Record<string,unknown>}>('select public.thuraya_snapshot(false) as d');assert.equal('orders' in publicSnapshot.rows[0].d,false);assert.equal('privateProducts' in publicSnapshot.rows[0].d,false);
});
await check('shipping order validates destination and recomputes free delivery and ETA',async()=>{
await db.exec('begin');try{
await db.query("update public.shipping_zones set cities=array['Test'],eta_min=20,eta_max=25 where id='test'");
const checkout={...input,idempotencyKey:'00000000-0000-4000-8000-000000000103'};
await db.exec('savepoint city');await assert.rejects(db.query('select public.thuraya_place_order($1,$2,$3,$4)',[JSON.stringify({...checkout,city:'Other'}),'eh','ph','shipping-request']));await db.exec('rollback to city');
await db.query("update public.shipping_zones set active=false where id='test'");
await db.exec('savepoint inactive');await assert.rejects(db.query('select public.thuraya_place_order($1,$2,$3,$4)',[JSON.stringify(checkout),'eh','ph','shipping-request']));await db.exec('rollback to inactive');
await db.query("update public.shipping_zones set active=true where id='test'");
await db.query("update public.store_settings set config=jsonb_set(config,'{freeShippingThreshold}','1')");
const result=await db.query<{o:{shipping:number;etaMin:number;etaMax:number}}>('select public.thuraya_place_order($1,$2,$3,$4) as o',[JSON.stringify(checkout),'eh','ph','shipping-request']);assert.equal(result.rows[0].o.shipping,0);assert.equal(result.rows[0].o.etaMin,20);assert.equal(result.rows[0].o.etaMax,25);
}finally{await db.exec('rollback')}
});
await check('lab-grown diamond product and variant specifications persist without schema rebuild',async()=>{
await db.exec('begin');try{
const diamond=structuredClone(p);diamond.gem={type:'lab_grown_diamond',carat:1.2,shape:'oval',color:'F',clarity:'VS1',cutGrade:'owner configured',certificationType:'confirmed lab',certificationIncluded:true};diamond.variants[0].gem={type:'lab_grown_diamond',carat:1.5,color:'G'};
await db.query('select public.thuraya_save_product($1,$2)',[JSON.stringify(diamond),owner]);
const result=await db.query<{p:{gem:unknown;variants:{id:string;gem:unknown}[]}}>('select private.product_view(p) as p from public.products p where id=$1',[p.id]);assert.deepEqual(result.rows[0].p.gem,diamond.gem);assert.deepEqual(result.rows[0].p.variants.find(v=>v.id===diamond.variants[0].id)?.gem,diamond.variants[0].gem);
}finally{await db.exec('rollback')}
});
console.log(`${count} database integration checks passed (local Postgres/WASM; Supabase Auth/Storage mocked).`);
}
await db.close();
