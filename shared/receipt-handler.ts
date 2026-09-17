import {readLimitedBody} from './request-body.ts';
import {resendReceipt} from './resend-receipts.ts';
type Receipt=NonNullable<Awaited<ReturnType<typeof resendReceipt>>>;
export async function handleReceipt(req:Request,options:{enabled:boolean;secret:string;record:(receipt:Receipt)=>Promise<unknown>;now?:number}){
 const reply=(status:number)=>new Response(null,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
 if(req.method!=='POST')return reply(405);
 if(!options.enabled||!options.secret)return reply(503);
 let receipt;
 try{receipt=await resendReceipt(await readLimitedBody(req,262144),req.headers,options.secret,options.now)}catch{return reply(401)}
 if(!receipt)return reply(204);
 try{await options.record(receipt);return reply(204)}catch{return reply(503)}
}
