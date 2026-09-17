import type {AdminOrder,Product,Taxonomy} from './domain.ts';

export interface TopProductInsight {id:string;name:string;units:number;revenue:number}
export interface TopCollectionInsight {id:string;name:string;units:number}

export function adminInsights(products:Product[],collections:Taxonomy[],orders:AdminOrder[],limit=5){
 const paid=orders.filter(order=>order.paymentStatus==='paid');
 const productsById=new Map(products.map(product=>[product.id,product]));
 const productTotals=new Map<string,{units:number;revenue:number}>();
 const collectionTotals=new Map<string,number>();
 for(const order of paid)for(const item of order.items){
  const product=productsById.get(item.productId);if(!product)continue;
  const total=productTotals.get(product.id)||{units:0,revenue:0};
  total.units+=item.quantity;total.revenue+=item.lineTotal;productTotals.set(product.id,total);
  for(const collectionId of product.collectionIds)collectionTotals.set(collectionId,(collectionTotals.get(collectionId)||0)+item.quantity);
 }
 const byUnits=<T extends {units:number}>(a:T,b:T)=>b.units-a.units;
 return {
  topProducts:[...productTotals.entries()].map(([id,total])=>({id,name:productsById.get(id)!.name.en,units:total.units,revenue:total.revenue})).sort((a,b)=>byUnits(a,b)||b.revenue-a.revenue||a.name.localeCompare(b.name)).slice(0,limit),
  topCollections:[...collectionTotals.entries()].map(([id,units])=>({id,name:collections.find(collection=>collection.id===id)?.name.en||id,units})).sort((a,b)=>byUnits(a,b)||a.name.localeCompare(b.name)).slice(0,limit)
 };
}
