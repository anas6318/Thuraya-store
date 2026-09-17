import {test,type TestContext} from 'node:test';
import assert from 'node:assert/strict';
import {analytics,analyticsState,configureAnalytics} from '../../src/services/analytics.ts';
const ids={ga4:'G-LOADER',meta:'',tiktok:''};
function harness(t:TestContext){
 let allowed=true,blocked=false;
 const scripts:{onload:(()=>void)|null;onerror:(()=>void)|null;remove:()=>void;removed:boolean;src?:string}[]=[];
 const win={location:{origin:'https://thuraya.example'},dataLayer:[] as unknown[][]};
 const globals:Record<string,unknown>={localStorage:{getItem:()=>allowed?'accept':null},window:win,document:{createElement:()=>{const s={onload:null,onerror:null,removed:false,remove(){this.removed=true}};scripts.push(s);return s},head:{appendChild:()=>{if(blocked)throw Error('blocked')}}}};
 const original=Object.fromEntries(Object.keys(globals).map(k=>[k,Object.getOwnPropertyDescriptor(globalThis,k)]));
 for(const [k,value] of Object.entries(globals))Object.defineProperty(globalThis,k,{configurable:true,value});
 t.after(()=>{configureAnalytics({ga4:'',meta:'',tiktok:''});for(const k of Object.keys(globals)){if(original[k])Object.defineProperty(globalThis,k,original[k]!);else Reflect.deleteProperty(globalThis,k)}});
 return {scripts,win,allow:(v:boolean)=>{allowed=v},block:()=>{blocked=true},events:()=>win.dataLayer.filter(e=>e[0]==='event')};
}
test('loader waits for script completion and flushes a first-page event once',t=>{const h=harness(t);configureAnalytics(ids);analytics('view_item',{item_id:'piece'});assert.equal(analyticsState().ga4,'loading');assert.equal(h.events().length,0);h.scripts[0].onload!();assert.equal(analyticsState().ga4,'initialized');assert.equal(h.events().length,1);configureAnalytics(ids);assert.equal(h.scripts.length,1)});
test('script failure discards events and never initializes',t=>{const h=harness(t);configureAnalytics(ids);analytics('view_item');h.scripts[0].onerror!();assert.equal(analyticsState().ga4,'disabled');assert.equal(h.events().length,0);assert.equal(h.scripts[0].removed,true)});
test('script timeout discards pending events',t=>{t.mock.timers.enable({apis:['setTimeout']});const h=harness(t);configureAnalytics(ids);analytics('view_item');t.mock.timers.tick(15001);assert.equal(analyticsState().ga4,'disabled');assert.equal(h.events().length,0);assert.equal(h.scripts[0].removed,true)});
test('no consent creates no script and withdrawal defeats a stale callback',t=>{const h=harness(t);h.allow(false);configureAnalytics(ids);assert.equal(h.scripts.length,0);h.allow(true);configureAnalytics(ids);const stale=h.scripts[0].onload!;analytics('view_item');h.allow(false);configureAnalytics(ids);stale();assert.equal(analyticsState().ga4,'disabled');assert.equal(h.events().length,0)});
test('ID change cannot flush old events to the new provider ID',t=>{const h=harness(t);configureAnalytics(ids);const stale=h.scripts[0].onload!;analytics('view_item',{item_id:'old'});configureAnalytics({...ids,ga4:'G-NEW'});stale();h.scripts[1].onload!();assert.equal(h.events().length,0);analytics('view_item',{item_id:'new'});assert.equal(h.events().length,1)});
test('blocked script insertion does not interrupt the storefront',t=>{const h=harness(t);h.block();assert.doesNotThrow(()=>configureAnalytics(ids));assert.equal(analyticsState().ga4,'disabled');assert.equal(h.events().length,0)});
