import {z} from 'zod';
const id=z.string().min(1).max(100);
const text=z.string().max(200);
const localized=z.object({ar:z.string().max(20000),he:z.string().max(20000),en:z.string().max(20000)}).strict();
const measurement=z.number().finite().nonnegative().max(100000).optional();
const money=z.number().int().nonnegative().max(100000000);
const gem=z.object({type:text.optional(),shape:text.optional(),sizeMm:measurement,carat:measurement,caratEquivalent:measurement,totalCaratWeight:measurement,count:z.number().int().nonnegative().max(100000).optional(),color:text.optional(),clarity:text.optional(),cutGrade:text.optional(),certificationType:text.optional(),certificationIncluded:z.boolean().optional(),certificateReference:text.optional()}).strict();
const metal=z.object({metal:text.optional(),purity:text.optional(),finish:text.optional(),plating:text.optional(),color:text.optional()}).strict();
const measurements=z.object({widthMm:measurement,thicknessMm:measurement,chainWidthMm:measurement,stoneDiameterMm:measurement,necklaceLengthCm:measurement,braceletLengthCm:measurement,ringSize:text.optional(),earringDimensions:text.optional(),weightGrams:measurement,clasp:text.optional(),setting:text.optional()}).strict();
const media=z.object({id,src:z.string().max(2048),storagePath:z.string().max(512).optional(),variantId:id.optional(),alt:localized,kind:z.enum(['image','video','certificate']),width:z.number().int().positive().max(20000),height:z.number().int().positive().max(20000),position:z.number().int().nonnegative(),mime:z.string().max(100),bytes:z.number().int().positive().max(20971520).optional()}).strict();
export const productSchema=z.object({
  id,sku:text,slug:id.regex(/^[a-z0-9-]+$/),status:z.enum(['draft','published','archived']),
  name:localized,shortDescription:localized,description:localized,seoTitle:localized,seoDescription:localized,
  categoryId:text,collectionIds:z.array(id).max(100),tags:z.array(text).max(100),
  featured:z.boolean(),bestseller:z.boolean(),newArrival:z.boolean(),publishAt:z.string().datetime().nullable(),
  basePrice:money.nullable(),compareAtPrice:money.nullable(),gem,metal,measurements,
  axes:z.array(z.object({id,kind:z.enum(['metal_color','stone_size','shape','necklace_length','bracelet_length','ring_size','quantity_type','gemstone']),label:localized,values:z.array(z.object({id,label:localized,numericValue:measurement}).strict()).max(100)}).strict()).max(8),
  variants:z.array(z.object({id,sku:text,options:z.record(id,id),adjustment:z.number().int().min(-100000000).max(100000000),active:z.boolean(),stock:z.number().int().nonnegative().max(1000000).nullable(),gem,metal,measurements,mediaIds:z.array(id).max(50)}).strict()).max(200),
  media:z.array(media).max(50),madeToOrder:z.boolean(),leadMin:z.number().int().nonnegative().max(365).nullable(),leadMax:z.number().int().nonnegative().max(365).nullable(),customization:z.boolean(),shippingCountries:z.array(z.string().regex(/^[A-Z]{2}$/)).max(250),included:localized,care:localized,isDemo:z.boolean(),createdAt:z.string().datetime()
}).strict().superRefine((p,ctx)=>{
  const issue=(message:string)=>ctx.addIssue({code:'custom',message});
  const unique=(values:string[])=>new Set(values).size===values.length;
  if(!unique(p.axes.map(a=>a.id))||!unique(p.axes.flatMap(a=>a.values.map(v=>v.id)))||!unique(p.variants.map(v=>v.id))||!unique(p.variants.map(v=>v.sku))||!unique(p.media.map(m=>m.id)))issue('Duplicate domain identifier');
  if(p.leadMin!==null&&p.leadMax!==null&&p.leadMax<p.leadMin)issue('Invalid lead time range');
  const combinations=new Set<string>();
  for(const v of p.variants){
    if(Object.keys(v.options).length!==p.axes.length||p.axes.some(a=>!a.values.some(x=>x.id===v.options[a.id])))issue('Invalid variant selection');
    const key=JSON.stringify(p.axes.map(a=>v.options[a.id]));if(combinations.has(key))issue('Duplicate variant combination');combinations.add(key);
    if(p.basePrice!==null&&p.basePrice+v.adjustment<0)issue('Negative variant price');
    if(v.mediaIds.some(id=>!p.media.some(m=>m.id===id)))issue('Variant references missing media');
  }
});
