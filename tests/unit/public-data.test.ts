import test from 'node:test';
import assert from 'node:assert/strict';
import {initialData} from '../../src/seed.ts';
import {customerCatalog} from '../../shared/public-data.ts';
test('public settings omit unknown private fields',()=>{const d=initialData();Object.assign(d.settings,{privateToken:'secret'});assert.equal(JSON.stringify(customerCatalog(d)).includes('privateToken'),false)});
test('public catalog omits private top-level tables',()=>{const result=customerCatalog(initialData());assert.equal('privateProducts' in result,false);assert.equal('orders' in result,false);assert.equal('customers' in result,false)});
test('review serialization removes raw database customer IDs',()=>{const d=initialData();d.reviews=[{id:'r',productId:'p',customerId:'private',customer_id:'private',name:'Approved reviewer',rating:5,text:'Review',media:[],verified:true,status:'approved',createdAt:''} as typeof d.reviews[number]];const result=customerCatalog(d);assert.equal(JSON.stringify(result.reviews).includes('private'),false)});
test('public catalog retains enabled notification consent controls',()=>{const d=initialData();d.settings.whatsappEnabled=true;const result=customerCatalog(d);assert.equal(result.settings.whatsappEnabled,true);assert.deepEqual(result.settings.templates,[])});
