import {z} from 'zod';
export const merchantMethods=['card','bit','paybox','paypal'] as const;
export type MerchantMethod=typeof merchantMethods[number];
export const paymentEventSchema=z.object({provider:z.enum(merchantMethods),eventId:z.string().min(1).max(200),orderId:z.string().min(1).max(100),amount:z.number().int().nonnegative().max(2147483647),currency:z.literal('ILS'),outcome:z.enum(['pending','paid','failed','refunded'])}).strict();
export type VerifiedPaymentEvent=z.infer<typeof paymentEventSchema>;
/** Implementations must authenticate raw bytes before returning a normalized event.
 * No client-supplied "verified" flag is accepted by this boundary. */
export interface PaymentAdapter {
 method:MerchantMethod;
 configured:()=>boolean;
 verifyCallback:(raw:Uint8Array,headers:Headers)=>Promise<VerifiedPaymentEvent>;
}
export async function verifyPaymentCallback(adapter:PaymentAdapter|undefined,raw:Uint8Array,headers:Headers){
 if(!adapter||!adapter.configured())throw new Error('provider_not_configured');
 if(raw.length===0||raw.length>262144)throw new Error('invalid_callback');
 const event=paymentEventSchema.parse(await adapter.verifyCallback(raw,headers));
 if(event.provider!==adapter.method)throw new Error('provider_mismatch');
 return event;
}
