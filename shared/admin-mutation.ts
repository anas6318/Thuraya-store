/** Read models include database aliases and delivery-only properties. They are
 * not mutation models. Keep the server's strict schemas intact. */
const keys:Record<string,readonly string[]>={
 zones:['id','name','country','cities','price','etaMin','etaMax','active'],
 pages:['id','slug','kind','title','body','status','legalReviewed'],
 discounts:['id','code','kind','value','active','startsAt','endsAt','usageLimit','used','minimumSubtotal','productIds','collectionIds'],
 media:['id','src','storagePath','alt','kind','width','height','position','mime','bytes'],
 sections:['id','kind','enabled','position','title','body','cta','href','image','selection','layout'],
 categories:['id','slug','name','description','image','position','active'],
 collections:['id','slug','name','description','image','position','active'],
 reviews:['id','status'],inquiries:['id','status']
};
const timestamp=(value:unknown)=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(value)&&Number.isFinite(Date.parse(value))?new Date(value).toISOString():value;
export function adminMutation(entity:string,value:object):object{
 if(entity==='products'){
  const product=value as {createdAt?:string;publishAt?:string|null;media?:object[];axes?:{values:{numericValue?:number|null}[]}[]};
  return {...value,createdAt:timestamp(product.createdAt),publishAt:timestamp(product.publishAt),media:product.media?.map(media=>adminMutation('media',media)),axes:product.axes?.map(axis=>({...axis,values:axis.values.map(option=>{const result={...option};if(result.numericValue===null)delete result.numericValue;return result})}))};
 }
 if(!keys[entity])return value;
 const row=value as Record<string,unknown>;
 return Object.fromEntries(keys[entity].filter(key=>key in row&&!(entity==='media'&&['storagePath','bytes'].includes(key)&&row[key]==null)).map(key=>[key,entity==='discounts'&&['startsAt','endsAt'].includes(key)?timestamp(row[key]):row[key]]));
}
