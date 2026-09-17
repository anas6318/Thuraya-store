type StorageLike=Pick<Storage,'getItem'|'setItem'>;
/** Optional device-local convenience must never break shopping. */
export function rememberHistory(key:string,item:string,limit:number,storage?:StorageLike):string[]{
 try{
  const target=storage??localStorage;
  const parsed:unknown=JSON.parse(target.getItem(key)||'[]');
  const prior=Array.isArray(parsed)?parsed.filter((v):v is string=>typeof v==='string'&&v.length<=200):[];
  const value=item.trim().slice(0,200);const next=[...new Set([...(value?[value]:[]),...prior])].slice(0,limit);
  try{target.setItem(key,JSON.stringify(next))}catch{/* private browsing/quota: no persistence */}
  return next;
 }catch{return item.trim()?[item.trim().slice(0,200)]:[]}
}
