import {z} from 'zod';
const bytes=(s:string)=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
/** Svix documented raw-body HMAC contract; 300s local replay tolerance. */
export async function verifyResendSignature(raw:Uint8Array,headers:Headers,secret:string,now=Date.now()){
 const id=headers.get('svix-id')||'',timestamp=headers.get('svix-timestamp')||'',signatures=headers.get('svix-signature')||'';
 if(!secret.startsWith('whsec_')||!id||id.length>200||!/^\d{1,12}$/.test(timestamp)||Math.abs(now/1000-Number(timestamp))>300||signatures.length>4096)throw new Error('invalid_signature');
 const key=await crypto.subtle.importKey('raw',bytes(secret.slice(6)),{name:'HMAC',hash:'SHA-256'},false,['verify']);
 const prefix=new TextEncoder().encode(id+'.'+timestamp+'.');const signed=new Uint8Array(prefix.length+raw.length);signed.set(prefix);signed.set(raw,prefix.length);
 for(const signature of signatures.split(' ')){
  if(!signature.startsWith('v1,'))continue;
  try{if(await crypto.subtle.verify('HMAC',key,bytes(signature.slice(3)),signed))return id}catch{/* malformed candidate is not authentication */}
 }
 throw new Error('invalid_signature');
}
const mapping:Record<string,string>={'email.sent':'accepted','email.delivered':'delivered','email.bounced':'bounced','email.failed':'failed','email.complained':'complained','email.suppressed':'suppressed'};
export async function resendReceipt(raw:Uint8Array,headers:Headers,secret:string,now=Date.now()){
 const eventId=await verifyResendSignature(raw,headers,secret,now);
 const body=z.object({type:z.string(),created_at:z.string().datetime(),data:z.object({email_id:z.string().uuid()})}).parse(JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(raw)));
 const state=mapping[body.type];if(!state)return null; // Opens/clicks are not proof of reading.
 return {provider:'resend',eventId,messageId:body.data.email_id,state,occurredAt:body.created_at};
}
