import {safeAnalyticsPayload,type AnalyticsEvent,type AnalyticsPayload} from './analytics.ts';
export type AnalyticsProvider='ga4'|'meta'|'tiktok';
type SafePayload=ReturnType<typeof safeAnalyticsPayload>;
export interface AnalyticsAdapter {id:string;send:(event:AnalyticsEvent,payload:SafePayload)=>void;revoke?:()=>void}
type Pending={provider:AnalyticsProvider;id:string;event:AnalyticsEvent;payload:SafePayload;at:number;done?:()=>void};
/** Memory only; queued events are never reported as dispatched. */
export class AnalyticsLifecycle {
 private ids:Record<AnalyticsProvider,string>={ga4:'',meta:'',tiktok:''};
 private adapters=new Map<AnalyticsProvider,AnalyticsAdapter>();
 private pending:Pending[]=[];
 private starting=new Map<AnalyticsProvider,string>();
 private allowed=false;
 private purchases=new Set<string>();
 constructor(private now=()=>Date.now()){}
 configure(ids:Record<AnalyticsProvider,string>,allowed:boolean){
  for(const [p,a] of this.adapters)if(!allowed||ids[p]!==a.id){try{a.revoke?.()}catch{/* telemetry cannot block checkout */}this.adapters.delete(p)}
  this.ids={...ids};this.allowed=allowed;
  this.pending=this.pending.filter(e=>allowed&&ids[e.provider]===e.id);
  for(const [p,id] of this.starting)if(!allowed||ids[p]!==id)this.starting.delete(p);
 }
 begin(provider:AnalyticsProvider,id:string){if(!this.allowed||!id||this.ids[provider]!==id)return false;this.starting.set(provider,id);return true}
 fail(provider:AnalyticsProvider,id:string){if(this.starting.get(provider)===id)this.starting.delete(provider);this.pending=this.pending.filter(e=>e.provider!==provider||e.id!==id)}
 register(provider:AnalyticsProvider,adapter:AnalyticsAdapter){
  if(!this.allowed||this.ids[provider]!==adapter.id){try{adapter.revoke?.()}catch{/* stale loader */}return ()=>{}}
  this.adapters.set(provider,adapter);this.starting.delete(provider);
  const queue=this.pending;this.pending=[];
  for(const e of queue){if(e.provider!==provider){this.pending.push(e);continue}if(e.id===adapter.id&&this.now()-e.at<=30000)this.dispatch(adapter,e)}
  return ()=>{if(this.adapters.get(provider)===adapter)this.adapters.delete(provider)};
 }
 state(provider:AnalyticsProvider){return !this.allowed||!this.ids[provider]?'disabled':this.adapters.get(provider)?.id===this.ids[provider]?'initialized':this.starting.get(provider)===this.ids[provider]?'loading':'disabled'}
 private dispatch(adapter:AnalyticsAdapter,e:Pending){
  const key=e.event==='purchase'&&e.payload.transaction_id?JSON.stringify([e.provider,e.id,e.payload.transaction_id]):null;
  if(key&&this.purchases.has(key))return false;
  try{adapter.send(e.event,e.payload)}catch{return false}
  if(key){this.purchases.add(key);if(this.purchases.size>500)this.purchases.delete(this.purchases.values().next().value!)}
  try{e.done?.()}catch{/* observer is isolated */}return true;
 }
 event(event:AnalyticsEvent,payload:AnalyticsPayload={},done?:()=>void){
  if(!this.allowed)return false;
  const safe=safeAnalyticsPayload(payload);let dispatched=false;
  this.pending=this.pending.filter(e=>this.now()-e.at<=30000);
  for(const provider of ['ga4','meta','tiktok'] as const){
   const id=this.ids[provider];if(!id)continue;
   const e:Pending={provider,id,event,payload:safe,at:this.now(),done};
   const adapter=this.adapters.get(provider);
   if(adapter?.id===id)dispatched=this.dispatch(adapter,e)||dispatched;
   else if(this.starting.get(provider)===id){
    if(event==='purchase'&&safe.transaction_id&&this.pending.some(p=>p.provider===provider&&p.event===event&&p.payload.transaction_id===safe.transaction_id))continue;
    this.pending.push(e);if(this.pending.length>100)this.pending.shift();
   }
  }
  return dispatched;
 }
}
