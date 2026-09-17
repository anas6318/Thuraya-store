import test from 'node:test';
import assert from 'node:assert/strict';
import {readLimitedBody} from '../../shared/request-body.ts';
const streamed=(stream:ReadableStream<Uint8Array>)=>new Request('https://store.test',{method:'POST',body:stream,duplex:'half'} as RequestInit);
test('bounded request reader preserves exact signature bytes',async()=>{
 const bytes=new Uint8Array([0,255,128,13,10]);
 assert.deepEqual(await readLimitedBody(new Request('https://store.test',{method:'POST',body:bytes}),5),bytes);
});
test('bounded request reader rejects declared oversized body before reading',async()=>{
 await assert.rejects(readLimitedBody(new Request('https://store.test',{method:'POST',body:'a',headers:{'Content-Length':'999'}}),10),/request_too_large/);
});
test('bounded request reader cancels oversized chunked body',async()=>{
 let cancelled=false;
 const req=streamed(new ReadableStream({start(c){c.enqueue(new Uint8Array(6))},cancel(){cancelled=true}}));
 await assert.rejects(readLimitedBody(req,5),/request_too_large/);assert.equal(cancelled,true);
});
test('bounded request reader times out stalled bodies and cancels work',async()=>{
 let cancelled=false;const req=streamed(new ReadableStream({cancel(){cancelled=true}}));
 await assert.rejects(readLimitedBody(req,10,5),/request_timeout/);assert.equal(cancelled,true);
});
test('bounded request reader permits empty body and rejects invalid limits',async()=>{
 assert.equal((await readLimitedBody(new Request('https://store.test'),10)).length,0);
 await assert.rejects(readLimitedBody(new Request('https://store.test'),0),/invalid_body_limit/);
});
