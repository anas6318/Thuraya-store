import type {CartLine} from './domain.ts';

const id=(value:unknown):value is string=>typeof value==='string'&&/^[A-Za-z0-9_-]{1,120}$/.test(value);
/** Treat device storage as untrusted convenience data, never as an order input. */
export function restoreCart(value:unknown,limit=50):CartLine[]{
 if(!Array.isArray(value)||!Number.isInteger(limit)||limit<1)return [];
 const lines=new Map<string,CartLine>();
 for(const candidate of value){
  if(!candidate||typeof candidate!=='object')continue;
  const line=candidate as Record<string,unknown>;
  const quantity=line.quantity;
  if(!id(line.productId)||!id(line.variantId)||typeof quantity!=='number'||!Number.isInteger(quantity)||quantity<1||quantity>10)continue;
  const existing=lines.get(line.variantId);
  if(existing){
   // A variant cannot safely belong to two products. Preserve the first valid line.
   if(existing.productId===line.productId)existing.quantity=Math.min(10,existing.quantity+quantity);
   continue;
  }
  if(lines.size<limit)lines.set(line.variantId,{productId:line.productId,variantId:line.variantId,quantity});
 }
 return [...lines.values()];
}
export function restoreIds(value:unknown,limit=100):string[]{
 if(!Array.isArray(value)||!Number.isInteger(limit)||limit<1)return [];
 return [...new Set(value.filter(id))].slice(0,limit);
}
