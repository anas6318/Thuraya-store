export type AnalyticsEvent='view_item'|'view_item_list'|'search'|'select_item'|'add_to_wishlist'|'add_to_cart'|'view_cart'|'begin_checkout'|'add_shipping_info'|'add_payment_info'|'purchase';
export interface AnalyticsPayload {item_id?:string;item_ids?:string[];value?:number;quantity?:number;transaction_id?:string}
export function safeAnalyticsPayload(p:AnalyticsPayload){
  const identifier=(x:unknown):x is string=>typeof x==='string'&&/^[A-Za-z0-9_-]{1,100}$/.test(x);
  return {currency:'ILS',...(identifier(p.item_id)?{item_id:p.item_id}:{}),...(Array.isArray(p.item_ids)?{items:p.item_ids.filter(identifier).slice(0,100).map(item_id=>({item_id}))}:{}),...(typeof p.value==='number'&&Number.isFinite(p.value)&&p.value>=0?{value:p.value}:{}),...(Number.isInteger(p.quantity)&&p.quantity!>0?{quantity:p.quantity}:{}),...(identifier(p.transaction_id)?{transaction_id:p.transaction_id}:{})};
}
