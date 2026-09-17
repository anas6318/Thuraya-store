import {test} from 'node:test';
import assert from 'node:assert/strict';
import {persistNotificationResult,runNotificationBatch} from '../../shared/notification-worker-batch.ts';

test('a failed result write cannot strand later claimed jobs or mark acceptance',async()=>{
 const visited:string[]=[];
 const outcome=await runNotificationBatch(['first','second','third'],async job=>{
  visited.push(job);
  if(job==='first'){
   const saved=await persistNotificationResult(async()=>{throw Error('database unavailable')});
   return {accepted:saved.committed,persistenceFailures:Number(saved.persistenceFailed)};
  }
  if(job==='second')throw Error('provider transport unavailable');
  return {accepted:true,persistenceFailures:0};
 });
 assert.deepEqual(visited,['first','second','third']);
 assert.deepEqual(outcome,{processed:3,accepted:1,persistenceFailures:1,internalFailures:1});
});

test('stale and duplicate result responses are not accepted or counted as failures',async()=>{
 const outcome=await runNotificationBatch(['stale','duplicate'],async()=>{
  const saved=await persistNotificationResult(async()=>false);
  return {accepted:saved.committed,persistenceFailures:Number(saved.persistenceFailed)};
 });
 assert.deepEqual(outcome,{processed:2,accepted:0,persistenceFailures:0,internalFailures:0});
});

test('a later completion still counts after an earlier persistence failure',async()=>{
 let calls=0;
 const outcome=await runNotificationBatch([1,2],async()=>{
  calls++;
  const saved=await persistNotificationResult(async()=>{if(calls===1)throw Error('write');return true});
  return {accepted:saved.committed,persistenceFailures:Number(saved.persistenceFailed)};
 });
 assert.equal(outcome.accepted,1);
 assert.equal(outcome.persistenceFailures,1);
});
