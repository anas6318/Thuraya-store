export async function hashValue(value:string,secret:string){
  if(secret.length<32)throw new Error('secret_missing');
  const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
  return Array.from(new Uint8Array(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(value))),n=>n.toString(16).padStart(2,'0')).join('');
}
export function matchesMagic(bytes:Uint8Array,mime:string){
  const ascii=(start:number,end:number)=>String.fromCharCode(...bytes.slice(start,end));
  if(mime==='image/jpeg')return bytes[0]===255&&bytes[1]===216&&bytes[2]===255;
  if(mime==='image/png')return bytes[0]===137&&ascii(1,4)==='PNG'&&bytes[4]===13&&bytes[5]===10;
  if(mime==='image/webp')return ascii(0,4)==='RIFF'&&ascii(8,12)==='WEBP';
  if(mime==='image/avif')return ascii(4,8)==='ftyp'&&['avif','avis'].includes(ascii(8,12));
  if(mime==='video/mp4')return ascii(4,8)==='ftyp'&&['isom','iso2','mp41','mp42','avc1','M4V '].includes(ascii(8,12));
  if(mime==='application/pdf')return ascii(0,5)==='%PDF-';
  return false;
}
