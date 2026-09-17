export const REVIEW_PHOTO_LIMIT=3;
export const REVIEW_PHOTO_BYTES=5*1024*1024;
export function reviewPhotoAllowed(mime:string,bytes:number,name:string){
  const extensions:Record<string,string[]>={'image/jpeg':['jpg','jpeg'],'image/png':['png'],'image/webp':['webp'],'image/avif':['avif']};
  return Number.isInteger(bytes)&&bytes>0&&bytes<=REVIEW_PHOTO_BYTES&&!!extensions[mime]?.includes(name.split('.').at(-1)?.toLowerCase()||'');
}
export function deliveryWidth(value:string|null){return value===null?1080:[320,640,1080].includes(Number(value))?Number(value):null}
