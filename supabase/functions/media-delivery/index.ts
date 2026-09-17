import {db,rpc,rate} from '../_shared/server.ts';
import {deliveryWidth} from '../../../shared/review-media.ts';
Deno.serve(async req=>{
  const security={'X-Content-Type-Options':'nosniff','Cache-Control':'private, no-store','Content-Security-Policy':"default-src 'none'; sandbox"};
  try {
    if(req.method!=='GET')return new Response(null,{status:405,headers:security});
    await rate(req,'media-delivery',240);
    const q=new URL(req.url).searchParams;const width=deliveryWidth(q.get('w'));
    if(!width)return new Response(null,{status:400,headers:security});
    let bucket='product-media',path='',mime='',kind='image';
    if(q.has('review')){
      path=q.get('review')!;if(path.length>512)throw new Error();bucket='review-media';
      mime=await rpc<string>('thuraya_public_review_media',{p_path:path});
    }else{
      const id=q.get('id')||'';if(id.length>100)throw new Error();
      const m=await rpc<{path:string;mime:string;kind:string}|null>('thuraya_public_product_media',{p_id:id});
      if(m){path=m.path;mime=m.mime;kind=m.kind}
    }
    if(!mime||!path)return new Response(null,{status:404,headers:security});
    const transformed=kind==='image';
    const {data,error}=await db.storage.from(bucket).createSignedUrl(path,60,transformed?{transform:{width,resize:'contain',quality:90}}:{});
    if(error||!data)throw new Error();
    const upstream=await fetch(data.signedUrl,{headers:{Accept:transformed?'image/webp':mime,...(kind==='video'&&req.headers.has('range')?{Range:req.headers.get('range')!}:{})},signal:AbortSignal.timeout(15000)});
    if(!upstream.ok)throw new Error();
    const type=upstream.headers.get('content-type')||mime;
    if(transformed&&!type.startsWith('image/'))throw new Error();
    const headers:Record<string,string>={...security,'Content-Type':type};
    if(kind==='certificate')headers['Content-Disposition']='attachment; filename="thuraya-certificate.pdf"';
    for(const key of ['content-range','accept-ranges','content-length']){const v=upstream.headers.get(key);if(v)headers[key]=v}
    return new Response(upstream.body,{status:upstream.status,headers});
  }catch{return new Response(null,{status:503,headers:security})}
});
