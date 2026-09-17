import {productGemstones,gemstoneKey} from './gemstones.ts';
import type {Product,Section} from './domain.ts';
import {searchMatch} from './logic.ts';
export function shopProducts(all:Product[],params:URLSearchParams,collectionId?:string|null,wishlist?:string[]){
 if(collectionId===null)return []; // A requested collection that does not exist is not the whole catalog.
 const q=params.get('q')||'';const category=params.get('category')||'';const sort=params.get('sort')||'featured';
 return all.filter(p=>(!wishlist||wishlist.includes(p.id))&&(!category||p.categoryId===category)&&(!collectionId||p.collectionIds.includes(collectionId))&&(!q||searchMatch(p,q))&&(!params.get('gemstone')||productGemstones(p).includes(gemstoneKey(params.get('gemstone')!)))&&(!params.get('metal')||p.metal.color===params.get('metal'))&&(!params.get('shape')||p.gem.shape===params.get('shape'))&&(!params.get('min')||(p.basePrice||0)>=Number(params.get('min'))*100)&&(!params.get('max')||(p.basePrice||0)<=Number(params.get('max'))*100))
 .sort((a,b)=>sort==='low'?(a.basePrice||0)-(b.basePrice||0):sort==='high'?(b.basePrice||0)-(a.basePrice||0):sort==='new'?b.createdAt.localeCompare(a.createdAt):Number(b.featured)-Number(a.featured));
}
export function sectionProducts(all:Product[],section:Section){
 if(!section.enabled||section.kind!=='collections')return [];
 const products=section.selection.length?all.filter(p=>section.selection.includes(p.id)):all.filter(p=>p.featured);
 return section.selection.some(id=>id.startsWith('collection:'))?products:products.slice(0,4);
}
export function homeProductIds(all:Product[],sections:Section[]){
 return [...new Set([...sections].sort((a,b)=>a.position-b.position).flatMap(s=>sectionProducts(all,s).map(p=>p.id)))];
}
