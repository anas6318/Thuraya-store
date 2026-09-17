import test from 'node:test';
import assert from 'node:assert/strict';
import {createHmac} from 'node:crypto';
import {verifyResendSignature,resendReceipt} from '../../shared/resend-receipts.ts';
import {handleReceipt} from '../../shared/receipt-handler.ts';
const secret='whsec_'+Buffer.from('test-only-webhook-key').toString('base64');const now=1731705121000;
function signed(type='email.delivered'){
 const raw=new TextEncoder().encode(JSON.stringify({type,created_at:'2024-11-15T20:00:00.000Z',data:{email_id:'00000000-0000-4000-8000-000000000001',to:['private@example.test'],subject:'private'}}));
 const headers=new Headers({'svix-id':'event-1','svix-timestamp':String(now/1000)});
 headers.set('svix-signature','v1,'+createHmac('sha256',Buffer.from(secret.slice(6),'base64')).update(Buffer.concat([Buffer.from('event-1.'+now/1000+'.'),raw])).digest('base64'));
 return {raw,headers};
}
test('signature verifier matches authoritative Svix test vector',async()=>{
 const headers=new Headers({'svix-id':'msg_loFOjxBNrRLzqYUf','svix-timestamp':'1731705121','svix-signature':'v1,rAvfW3dJ/X/qxhsaXPOyyCGmRKsaKWcsNccKXlIktD0='});
 assert.equal(await verifyResendSignature(new TextEncoder().encode('{"event_type":"ping","data":{"success":true}}'),headers,'whsec_plJ3nmyCDGBKInavdOK15jsl',now),'msg_loFOjxBNrRLzqYUf');
});
test('receipt authentication rejects tampering missing secret and expired/future signatures',async()=>{
 const {raw,headers}=signed();for(const clock of [now-301000,now+301000])await assert.rejects(resendReceipt(raw,headers,secret,clock));
 await assert.rejects(resendReceipt(raw,new Headers(),secret,now));await assert.rejects(resendReceipt(raw,headers,'',now));raw[1]^=1;await assert.rejects(resendReceipt(raw,headers,secret,now));
});
test('verified receipt excludes customer payload and maps provider semantics',async()=>{
 for(const [event,state] of [['email.sent','accepted'],['email.delivered','delivered'],['email.failed','failed'],['email.bounced','bounced'],['email.complained','complained'],['email.suppressed','suppressed']]){
  const {raw,headers}=signed(event);const r=await resendReceipt(raw,headers,secret,now);assert.equal(r?.state,state);assert.equal(JSON.stringify(r).includes('private'),false);
 }
});
test('opened and clicked events never become read receipts',async()=>{
 for(const type of ['email.opened','email.clicked']){const {raw,headers}=signed(type);assert.equal(await resendReceipt(raw,headers,secret,now),null)}
});
test('signature rotation accepts a valid v1 candidate but not unknown versions',async()=>{
 const {raw,headers}=signed();const valid=headers.get('svix-signature')!;headers.set('svix-signature','v1,invalid '+valid);assert.ok(await resendReceipt(raw,headers,secret,now));headers.set('svix-signature',valid.replace('v1,','v2,'));await assert.rejects(resendReceipt(raw,headers,secret,now));
});
test('receipt handler rejects unsigned requests without invoking storage',async()=>{
 let writes=0;const result=await handleReceipt(new Request('https://store.test',{method:'POST',body:'{}'}),{enabled:true,secret,now,record:async()=>{writes++}});assert.equal(result.status,401);assert.equal(writes,0);
});
test('receipt handler stays disabled without configuration and rejects GET',async()=>{
 const record=async()=>{throw Error('must not run')};
 assert.equal((await handleReceipt(new Request('https://store.test',{method:'POST'}),{enabled:false,secret,record})).status,503);
 assert.equal((await handleReceipt(new Request('https://store.test',{method:'POST'}),{enabled:true,secret:'',record})).status,503);
 assert.equal((await handleReceipt(new Request('https://store.test'),{enabled:true,secret,record})).status,405);
});
test('receipt handler acknowledges only committed verified events',async()=>{
 const {raw,headers}=signed();const request=()=>new Request('https://store.test',{method:'POST',headers,body:raw});let writes=0;
 assert.equal((await handleReceipt(request(),{enabled:true,secret,now,record:async()=>{writes++}})).status,204);assert.equal(writes,1);
 assert.equal((await handleReceipt(request(),{enabled:true,secret,now,record:async()=>{throw Error('database unavailable')}})).status,503);
});
test('receipt handler discards opened events without creating read state',async()=>{
 const {raw,headers}=signed('email.opened');let writes=0;
 assert.equal((await handleReceipt(new Request('https://store.test',{method:'POST',headers,body:raw}),{enabled:true,secret,now,record:async()=>{writes++}})).status,204);assert.equal(writes,0);
});
