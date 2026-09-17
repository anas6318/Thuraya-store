/** Limit bytes while streaming, including chunked requests without Content-Length. */
export async function readLimitedBody(request:Request,maxBytes:number,timeoutMs=15000):Promise<Uint8Array>{
 if(!Number.isSafeInteger(maxBytes)||maxBytes<1||!Number.isFinite(timeoutMs)||timeoutMs<1)throw new Error('invalid_body_limit');
 const declared=request.headers.get('content-length');
 if(declared!==null&&(!/^\d+$/.test(declared)||Number(declared)>maxBytes))throw new Error('request_too_large');
 const reader=request.body?.getReader();if(!reader)return new Uint8Array();
 const chunks:Uint8Array[]=[];let size=0;let completed=false;
 let timer:ReturnType<typeof setTimeout>|undefined;
 const timeout=new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(new Error('request_timeout')),timeoutMs)});
 try{
  while(true){const {done,value}=await Promise.race([reader.read(),timeout]);if(done){completed=true;break}
   size+=value.byteLength;if(size>maxBytes)throw new Error('request_too_large');chunks.push(value);
  }
  const raw=new Uint8Array(size);let offset=0;for(const chunk of chunks){raw.set(chunk,offset);offset+=chunk.byteLength}return raw;
 }finally{
  clearTimeout(timer);
  // Do not wait for an untrusted/stalled source's cancellation acknowledgement.
  if(!completed)void reader.cancel().catch(()=>{});
  reader.releaseLock();
 }
}
