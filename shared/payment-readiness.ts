import type {PaymentMethod} from './domain.ts';
/** Server supplies the account attestation; stored/client ready flags are never trusted. */
export function paymentReadiness(method:PaymentMethod,bankAccountConfirmed:boolean){
 if(method.id!=='bank_transfer')return {ready:false,reason:'provider_unimplemented' as const};
 if(!bankAccountConfirmed)return {ready:false,reason:'bank_account_unconfirmed' as const};
 if(!(['ar','he','en'] as const).every(locale=>method.instructions[locale].trim()))return {ready:false,reason:'instructions_incomplete' as const};
 return {ready:true,reason:'ready' as const};
}
