import type {Catalog,Media} from './domain.ts';
export function matchesMediaReference(reference:string,media:Media){return !!reference&&(reference===media.src||!!media.storagePath&&reference.includes(media.storagePath))}
export function mediaIsReferenced(data:Catalog,media:Media){return data.products.some(p=>p.media.some(m=>m.id===media.id)||p.variants.some(v=>v.mediaIds.includes(media.id)))||[...data.sections,...data.categories,...data.collections].some(row=>matchesMediaReference(row.image,media))}
export interface MediaReference {kind:'product'|'variant'|'homepage_section'|'category'|'collection';id:string;label:string}
export function mediaReferences(data:Catalog,media:Media):MediaReference[]{
 const refs:MediaReference[]=[];
 for(const product of data.products){
  if(product.media.some(item=>item.id===media.id))refs.push({kind:'product',id:product.id,label:`Product: ${product.name.en||product.id}`});
  for(const variant of product.variants)if(variant.mediaIds.includes(media.id))refs.push({kind:'variant',id:variant.id,label:`Variant: ${variant.sku||variant.id}`});
 }
 for(const section of data.sections)if(matchesMediaReference(section.image,media))refs.push({kind:'homepage_section',id:section.id,label:`Homepage: ${section.title.en||section.id}`});
 for(const category of data.categories)if(matchesMediaReference(category.image,media))refs.push({kind:'category',id:category.id,label:`Category: ${category.name.en||category.id}`});
 for(const collection of data.collections)if(matchesMediaReference(collection.image,media))refs.push({kind:'collection',id:collection.id,label:`Collection: ${collection.name.en||collection.id}`});
 return refs;
}
