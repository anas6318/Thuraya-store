import test from 'node:test';
import assert from 'node:assert/strict';
import {paymentReadiness} from '../../shared/payment-readiness.ts';
import type {PaymentMethod} from '../../shared/domain.ts';
const bank:PaymentMethod={id:'bank_transfer',enabled:true,ready:true,test:false,instructions:{ar:'تعليمات',he:'הוראות',en:'Instructions'}};
test('unimplemented merchants cannot become ready through stored flags or bank attestation',()=>{
 for(const id of ['card','bit','paybox','paypal'] as const)for(const testMode of [true,false])assert.deepEqual(paymentReadiness({...bank,id,test:testMode},true),{ready:false,reason:'provider_unimplemented'});
});
test('bank readiness requires server attestation regardless of stored ready flag',()=>{
 assert.equal(paymentReadiness(bank,false).ready,false);
 assert.equal(paymentReadiness({...bank,ready:false},true).ready,true);
});
test('bank readiness requires factual instructions in every launch language',()=>{
 for(const locale of ['ar','he','en'] as const)assert.deepEqual(paymentReadiness({...bank,instructions:{...bank.instructions,[locale]:'  '}},true),{ready:false,reason:'instructions_incomplete'});
});
test('readiness does not silently enable a disabled method or mutate settings',()=>{
 const disabled={...bank,enabled:false};paymentReadiness(disabled,true);assert.equal(disabled.enabled,false);
});
