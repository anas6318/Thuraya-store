import {merchantMethods,verifyPaymentCallback,type MerchantMethod} from '../../../shared/payments.ts';
import {paymentAdapters} from '../_shared/payment-adapters.ts';
import {rpc} from '../_shared/server.ts';
import {readLimitedBody} from '../../../shared/request-body.ts';
Deno.serve(async req=>{
 const headers={'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
 const reply=(error:string,status:number)=>new Response(JSON.stringify({error}),{status,headers});
 if(req.method!=='POST')return reply('method_not_allowed',405);
 const method=new URL(req.url).searchParams.get('provider') as MerchantMethod;
 if(!merchantMethods.includes(method)||!paymentAdapters[method]?.configured())return reply('provider_not_configured',503);
 try{
  const raw=await readLimitedBody(req,262144);
  const event=await verifyPaymentCallback(paymentAdapters[method],raw,req.headers);
  try{
   const result=await rpc('thuraya_payment_event',{p_provider:event.provider,p_event:event.eventId,p_order:event.orderId,p_amount:event.amount,p_currency:event.currency,p_outcome:event.outcome});
   return new Response(JSON.stringify(result),{status:200,headers});
  }catch{return reply('callback_not_committed',503)}
 }catch{return reply('callback_rejected',400)}
});
