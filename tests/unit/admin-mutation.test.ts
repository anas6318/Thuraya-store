import test from 'node:test';
import assert from 'node:assert/strict';
import {adminMutation} from '../../shared/admin-mutation';
import {shippingZoneSchema} from '../../shared/shipping';
test('database shipping aliases do not break strict editing schema',()=>{const row={id:'zone',name:{ar:'منطقة',he:'אזור',en:'Zone'},country:'IL',cities:[],price:100,etaMin:10,etaMax:14,eta_min:10,eta_max:14,active:true};assert.equal(shippingZoneSchema.safeParse(row).success,false);assert.equal(shippingZoneSchema.safeParse(adminMutation('zones',row)).success,true)});
test('media edits omit read-only aliases, timestamps and nullable optional fields',()=>{assert.deepEqual(adminMutation('media',{id:'m',storage_path:null,storagePath:null,bytes:null,created_at:'now',src:'/media/test.webp'}),{id:'m',src:'/media/test.webp'})});
test('CMS edits never submit delivery projection and moderation only submits status',()=>{assert.deepEqual(adminMutation('pages',{id:'p',legalReviewed:true,legal_reviewed:true,internalNote:'private'}),{id:'p',legalReviewed:true});assert.deepEqual(adminMutation('reviews',{id:'r',status:'approved',media:['private-path'],customerId:'private'}),{id:'r',status:'approved'});assert.deepEqual(adminMutation('sections',{id:'s',imageMedia:{src:'signed'}}),{id:'s'})});
test('promotion edit contains canonical eligibility and schedule fields only',()=>{assert.deepEqual(adminMutation('discounts',{id:'d',product_ids:['p'],productIds:['p'],starts_at:null,startsAt:null}),{id:'d',productIds:['p'],startsAt:null})});
test('database offset timestamps preserve their instant in strict UTC mutation fields',()=>{assert.deepEqual(adminMutation('discounts',{id:'d',startsAt:'2026-09-17T12:00:00+02:00',endsAt:null}),{id:'d',startsAt:'2026-09-17T10:00:00.000Z',endsAt:null})});
