import test from 'node:test';
import assert from 'node:assert/strict';
import {shippingZoneSchema,shipsTo,shippingEta,quoteKey,assertShippingProducts} from '../../shared/shipping';
import type {ShippingZone,Product} from '../../shared/domain';
const zone:ShippingZone={id:'test',name:{ar:'منطقة',he:'אזור',en:'Zone'},country:'IL',cities:['Haifa'],price:3500,etaMin:10,etaMax:14,active:true};
test('shipping publication requires every launch language; drafts may be incomplete',()=>{assert.equal(shippingZoneSchema.safeParse({...zone,name:{...zone.name,he:' '}}).success,false);assert.equal(shippingZoneSchema.safeParse({...zone,active:false,name:{ar:'',he:'',en:''}}).success,true)});
test('shipping rejects reversed, excessive ETA and invalid amounts',()=>{for(const change of [{etaMax:9},{etaMax:366},{price:-1},{price:1.5},{cities:['']}])assert.equal(shippingZoneSchema.safeParse({...zone,...change}).success,false)});
test('shipping destination selection excludes inactive and international zones',()=>{assert.equal(shipsTo(zone,'IL',' Haifa '),true);assert.equal(shipsTo(zone,'IL','Other'),false);assert.equal(shipsTo(zone,'US','Haifa'),false);assert.equal(shipsTo({...zone,active:false},'IL','Haifa'),false);assert.equal(shipsTo({...zone,cities:[]},'IL','Other'),true)});
test('shipping ETA matches database maximum of store, zone and product lead time',()=>{const products=[{id:'p',leadMin:2,leadMax:30}] as Product[];assert.deepEqual(shippingEta([{productId:'p',variantId:'v',quantity:1}],products,{leadMin:12,leadMax:14},zone),{etaMin:12,etaMax:30})});
test('quoted discounts become stale after destination, coupon or cart changes',()=>{const lines=[{productId:'p',variantId:'v',quantity:1}];const key=quoteKey(lines,'test','Haifa','SAVE');assert.notEqual(key,quoteKey(lines,'test','Other','SAVE'));assert.notEqual(key,quoteKey(lines,'test','Haifa','NEW'));assert.notEqual(key,quoteKey([{...lines[0],quantity:2}],'test','Haifa','SAVE'));assert.equal(key,quoteKey(lines,'test',' Haifa ','SAVE'))});

test('shipping quote rejects products ineligible for Israel before pricing',()=>{const lines=[{productId:'p',variantId:'v',quantity:1}];assert.throws(()=>assertShippingProducts(lines,[{id:'p',shippingCountries:['US']}] as Product[],'IL'));assert.doesNotThrow(()=>assertShippingProducts(lines,[{id:'p',shippingCountries:['IL']}] as Product[],'IL'))});
