import {rpc,env,settings,respond} from '../_shared/server.ts';
import {constantTimeEqual,normalizeContact} from '../../../shared/logic.ts';
import {notificationHtml} from '../../../shared/notifications.ts';
import {persistNotificationResult,runNotificationBatch} from '../../../shared/notification-worker-batch.ts';
import type {Locale,Order} from '../../../shared/domain.ts';

type Job={
 id:string;channel:'email'|'whatsapp';audience:'owner'|'customer';template_id:string;locale:Locale;attempts:number;
 payload:Record<string,unknown>|null;order:Order;contact:{email:string;phone:string};
};
type AttemptStatus='disabled'|'failed'|'sent';

Deno.serve(async req=>{
 if(req.method!=='POST'||!env('NOTIFICATION_WORKER_SECRET')||!constantTimeEqual(req.headers.get('authorization')||'',`Bearer ${env('NOTIFICATION_WORKER_SECRET')}`))return respond(req,{error:'forbidden'},403);
 const s=await settings();
 const jobs=await rpc<Job[]>('thuraya_claim_notifications');
 const batch=await runNotificationBatch(jobs,async j=>{
  let attempted=false;
  const result=async(status:AttemptStatus,providerId:string|null,error:string|null,uncertain=false)=>persistNotificationResult(()=>rpc<boolean>('thuraya_attempt_result',{
   p_id:j.id,p_attempt:j.attempts,p_status:status,p_provider_id:providerId,p_error:error,p_uncertain:uncertain
  }));
  try{
   const template=s.templates.find(t=>t.id===j.template_id);
   const owner=j.audience==='owner';
   const configured=j.channel==='email'
    ?s.emailEnabled&&env('EMAIL_PROVIDER')==='resend'&&env('RESEND_API_KEY')&&env('EMAIL_FROM')&&(owner?env('ORDER_NOTIFICATION_EMAIL'):j.contact.email)
    :s.whatsappEnabled&&env('WHATSAPP_PROVIDER')==='meta'&&env('WHATSAPP_ACCESS_TOKEN')&&env('WHATSAPP_PHONE_NUMBER_ID')&&env('WHATSAPP_GRAPH_VERSION')&&template?.providerTemplate[j.locale];
   if(!configured||!owner&&!template?.enabled){
    const saved=await result('disabled',null,'Channel or approved template is not configured');
    return {accepted:false,persistenceFailures:Number(saved.persistenceFailed)};
   }
   let payload=j.payload;
   if(!payload){
    if(j.channel==='email'){
     const subject=owner?`New order ${j.order.number}`:template!.subject[j.locale];
     const body=owner?'A new order has been committed. Open THURAYA Admin to review payment and fulfillment.':template!.body[j.locale];
     payload={from:env('EMAIL_FROM'),to:[owner?env('ORDER_NOTIFICATION_EMAIL'):j.contact.email],subject,html:notificationHtml({...j.order,locale:j.locale},subject,body,env('SITE_URL'),s.contactEmail)};
    }else{
     payload={messaging_product:'whatsapp',to:normalizeContact(j.contact.phone).replace('+',''),type:'template',template:{name:template!.providerTemplate[j.locale],language:{code:j.locale==='he'?'he':j.locale},components:[{type:'body',parameters:[{type:'text',text:j.order.number}]}]}};
    }
   }
   payload=await rpc<Record<string,unknown>>('thuraya_attempt_payload',{p_id:j.id,p_attempt:j.attempts,p_payload:payload});
   const url=j.channel==='email'?'https://api.resend.com/emails':`https://graph.facebook.com/${env('WHATSAPP_GRAPH_VERSION')}/${env('WHATSAPP_PHONE_NUMBER_ID')}/messages`;
   const headers:Record<string,string>={'Content-Type':'application/json',Authorization:`Bearer ${env(j.channel==='email'?'RESEND_API_KEY':'WHATSAPP_ACCESS_TOKEN')}`};
   if(j.channel==='email')headers['Idempotency-Key']=`thuraya/${j.id}`;
   attempted=true;
   const response=await fetch(url,{method:'POST',headers,body:JSON.stringify(payload),signal:AbortSignal.timeout(15000)});
   const data=await response.json();
   if(!response.ok)throw new Error(`provider_http_${response.status}`);
   const providerId=j.channel==='email'?data.id:data.messages?.[0]?.id;
   if(!providerId)throw new Error('provider_missing_receipt');
   const saved=await result('sent',String(providerId),null);
   return {accepted:saved.committed,persistenceFailures:Number(saved.persistenceFailed)};
  }catch(error){
   const reason=error instanceof Error&&/^provider_/.test(error.message)?error.message:'Provider outcome unavailable';
   const saved=await result('failed',null,reason,j.channel==='whatsapp'&&attempted);
   return {accepted:false,persistenceFailures:Number(saved.persistenceFailed)};
  }
 });
 return respond(req,{processed:batch.processed,accepted:batch.accepted,resultPersistenceFailures:batch.persistenceFailures,internalFailures:batch.internalFailures});
});
