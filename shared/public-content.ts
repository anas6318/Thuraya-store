import type {Catalog,ContentPage,Localized,Taxonomy} from './domain.ts';
import {parity} from './logic.ts';
/** Incomplete optional copy is absent in every locale, never an English fallback. */
export const publicCopy=(copy:Localized):Localized=>parity(copy)?{ar:copy.ar,he:copy.he,en:copy.en}:{ar:'',he:'',en:''};
export const publishedPage=(p:ContentPage)=>p.status==='published'&&parity(p.title)&&parity(p.body)&&(p.kind!=='policy'||p.legalReviewed);
export function contentAt(pages:ContentPage[],slug:string|undefined,path:string){const kind=path.includes('/policies/')?'policy':'education';return pages.find(p=>p.slug===slug&&(kind==='policy'?p.kind==='policy':p.kind!=='policy')&&publishedPage(p))}
export function publicContent(d:Catalog){
 const taxonomy=(rows:Taxonomy[])=>rows.filter(c=>c.active&&parity(c.name)).map(({id,slug,name,description,image,imageMedia,position,active})=>({id,slug,name:publicCopy(name),description:publicCopy(description),image,imageMedia,position,active}));
 return {
 categories:taxonomy(d.categories),collections:taxonomy(d.collections),
 sections:d.sections.filter(s=>s.enabled&&parity(s.title)&&parity(s.body)&&parity(s.cta)).map(({id,kind,enabled,position,title,body,cta,href,image,imageMedia,selection,layout})=>({id,kind,enabled,position,title:publicCopy(title),body:publicCopy(body),cta:publicCopy(cta),href,image,imageMedia,selection:selection.filter(id=>id.startsWith('collection:')?d.collections.some(c=>c.id===id.slice(11)&&c.active&&parity(c.name)):d.products.some(p=>p.id===id&&p.status==='published'&&(!p.publishAt||Date.parse(p.publishAt)<=Date.now()))),layout})),
 pages:d.pages.filter(publishedPage).map(({id,slug,kind,title,body,status,legalReviewed})=>({id,slug,kind,title:publicCopy(title),body:publicCopy(body),status,legalReviewed})),
 zones:d.zones.filter(z=>z.active&&z.country==='IL'&&parity(z.name)).map(({id,name,country,cities,price,etaMin,etaMax,active})=>({id,name:publicCopy(name),country,cities,price,etaMin,etaMax,active}))
 };
}
