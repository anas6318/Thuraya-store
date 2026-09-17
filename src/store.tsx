import {analytics,configureAnalytics} from './services/analytics';
import {homeProductIds,shopProducts} from '../shared/catalog-selection';
import {restoreCart,restoreIds} from '../shared/cart-storage';
import {createContext,useContext,useEffect,useState,type ReactNode} from 'react';
import {useLocation} from 'react-router-dom';
import type {Catalog,CartLine,Customer,Locale} from '../shared/domain';
import {initialData} from './seed';
import * as api from './services/api';
import {config} from './config';
interface Store {data:Catalog;loading:boolean;error:string;refresh:()=>Promise<void>;customer:Customer|null;refreshSession:()=>Promise<void>;locale:Locale;cart:CartLine[];setCart:(v:CartLine[])=>void;add:(line:CartLine)=>void;wishlist:string[];toggleWish:(id:string)=>void;bagOpen:boolean;setBagOpen:(v:boolean)=>void;notice:string;notify:(v:string)=>void}
const Context=createContext<Store|null>(null);
export const useStore=()=>{const c=useContext(Context);if(!c)throw new Error('store missing');return c};
const local=(key:string,fallback:unknown):unknown=>{try{return typeof localStorage==='undefined'?fallback:JSON.parse(localStorage.getItem(key)||'null')??fallback}catch{return fallback}};
export function StoreProvider({children,initial}:{children:ReactNode;initial?:Catalog}){const location=useLocation();const seg=location.pathname.split('/')[1];const locale:Locale=seg==='ar'||seg==='he'?seg:'en';const [data,setData]=useState<Catalog>(initial||{...initialData(),products:[],pages:[]});const [loading,setLoading]=useState(!initial);const [error,setError]=useState('');const [customer,setCustomer]=useState<Customer|null>(null);const [cart,setCartState]=useState<CartLine[]>([]);const [wishlist,setWishlist]=useState<string[]>([]);const [bagOpen,setBagOpen]=useState(false);const [notice,notify]=useState('');
useEffect(()=>{configureAnalytics(data.settings.analytics)},[data.settings.analytics]);
useEffect(()=>{
  if(loading||config.demo)return;
  const path=location.pathname;const parts=path.split('/');
  if(parts[2]==='product'){const product=data.products.find(p=>p.slug===parts[3]);if(product)analytics('view_item',{item_id:product.id,value:product.basePrice===null?undefined:product.basePrice/100})}
  if(!parts[2])analytics('view_item_list',{item_ids:homeProductIds(data.products,data.sections)});
  if(['shop','collection'].includes(parts[2]))analytics('view_item_list',{item_ids:shopProducts(data.products,new URLSearchParams(location.search),parts[2]==='collection'?(data.collections.find(c=>c.active&&c.slug===parts[3])?.id??null):undefined).map(p=>p.id)});
  if(new URLSearchParams(location.search).get('q'))analytics('search');
  if(parts[2]==='cart')analytics('view_cart',{item_ids:cart.map(l=>l.productId)});
  if(parts[2]==='checkout'&&cart.length)analytics('begin_checkout',{item_ids:cart.map(l=>l.productId)});
},[location.pathname,location.search,loading]);
useEffect(()=>{if(bagOpen&&!config.demo)analytics('view_cart',{item_ids:cart.map(l=>l.productId)})},[bagOpen]);
const refresh=async()=>{try{setData(await api.catalog());setError('')}catch{setError('load_failed')}finally{setLoading(false)}};
const refreshSession=async()=>{try{const c=await api.session();setCustomer(c);if(c){const merged=await api.mergeWishlist(restoreIds(local('thuraya.wishlist',[])));setWishlist(merged);localStorage.setItem('thuraya.wishlist',JSON.stringify(merged))}}catch{setCustomer(null)}};
useEffect(()=>{void refresh();void refreshSession();setCartState(restoreCart(local('thuraya.cart',[])));setWishlist(restoreIds(local('thuraya.wishlist',[])));},[]);
useEffect(()=>{document.documentElement.lang=locale;document.documentElement.dir=locale==='en'?'ltr':'rtl';localStorage.setItem('thuraya.locale',locale);},[locale]);
useEffect(()=>{if(notice){const timer=setTimeout(()=>notify(''),4500);return()=>clearTimeout(timer)}},[notice]);
const setCart=(v:CartLine[])=>{const next=restoreCart(v);setCartState(next);try{localStorage.setItem('thuraya.cart',JSON.stringify(next))}catch{/* storage is optional */}};
const add=(line:CartLine)=>{analytics('add_to_cart',{item_id:line.productId,quantity:line.quantity});const existing=cart.find(l=>l.variantId===line.variantId);setCart(existing?cart.map(l=>l.variantId===line.variantId?{...l,quantity:Math.min(10,l.quantity+line.quantity)}:l):[...cart,line]);setBagOpen(true)};
const toggleWish=(id:string)=>{if(!wishlist.includes(id))analytics('add_to_wishlist',{item_id:id});const next=wishlist.includes(id)?wishlist.filter(x=>x!==id):[...wishlist,id];setWishlist(next);localStorage.setItem('thuraya.wishlist',JSON.stringify(next));if(customer&&!config.demo)void api.invoke('set-wishlist',{ids:next})};
return <Context.Provider value={{data,loading,error,refresh,customer,refreshSession,locale,cart,setCart,add,wishlist,toggleWish,bagOpen,setBagOpen,notice,notify}}>{children}</Context.Provider>}
