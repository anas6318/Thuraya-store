import type {Settings} from '../../shared/domain';
import type {AnalyticsEvent,AnalyticsPayload} from '../../shared/analytics';
import {AnalyticsLifecycle,type AnalyticsProvider,type AnalyticsAdapter} from '../../shared/analytics-lifecycle';
declare global{interface Window{dataLayer?:unknown[];gtag?:(...args:unknown[])=>void}}
let current:Settings['analytics']={ga4:'',meta:'',tiktok:''};
const runtime=new AnalyticsLifecycle();
const consent=()=>{try{return typeof localStorage!=='undefined'&&localStorage.getItem('thuraya.consent')==='accept'}catch{return false}};
let active:{id:string;cancel:()=>void}|undefined;
export function registerAnalyticsAdapter(provider:AnalyticsProvider,adapter:AnalyticsAdapter){runtime.configure(current,consent());return runtime.register(provider,adapter)}
export function analyticsState(){runtime.configure(current,consent());return Object.fromEntries((['ga4','meta','tiktok'] as const).map(p=>[p,runtime.state(p)]))}
export function configureAnalytics(ids:Settings['analytics']){
 current={...ids};const allowed=consent();runtime.configure(current,allowed);
 if(active&&(!allowed||active.id!==ids.ga4)){active.cancel();active=undefined}
 if(!allowed||typeof document==='undefined')return;
 const id=ids.ga4;if(!/^G-[A-Z0-9]+$/.test(id)||runtime.state('ga4')==='initialized'||active?.id===id)return;
 if(!runtime.begin('ga4',id))return;
 const script=document.createElement('script');script.async=true;script.referrerPolicy='no-referrer';script.src='https://www.googletagmanager.com/gtag/js?id='+encodeURIComponent(id);
 let cancelled=false;
 const cancel=()=>{cancelled=true;clearTimeout(timer);script.onload=null;script.onerror=null;script.remove();runtime.fail('ga4',id)};
 const timer=setTimeout(()=>{cancel();if(active?.id===id)active=undefined},15000);
 active={id,cancel};
 script.onload=()=>{
  clearTimeout(timer);if(cancelled||!consent()||current.ga4!==id){cancel();return}
  active=undefined;
  window.dataLayer=window.dataLayer||[];window.gtag=(...args)=>window.dataLayer!.push(args);
  window.gtag('consent','update',{analytics_storage:'granted',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
  window.gtag('js',new Date());window.gtag('config',id,{send_page_view:false,allow_google_signals:false,allow_ad_personalization_signals:false,page_location:window.location.origin,page_referrer:''});
  registerAnalyticsAdapter('ga4',{id,send:(event,p)=>window.gtag?.('event',event,{...p,...(p.item_id?{items:[{item_id:p.item_id,...(p.quantity?{quantity:p.quantity}:{})}]}:{}),send_to:id,page_location:window.location.origin,page_referrer:''}),revoke:()=>window.gtag?.('consent','update',{analytics_storage:'denied'})});
 };
 script.onerror=()=>{cancel();if(active?.id===id)active=undefined};try{document.head.appendChild(script)}catch{cancel();if(active?.id===id)active=undefined}
}
/** True means synchronous adapter dispatch, never queueing or provider receipt. */
export function analytics(event:AnalyticsEvent,payload:AnalyticsPayload={},onDispatch?:()=>void){runtime.configure(current,consent());return runtime.event(event,payload,onDispatch)}
