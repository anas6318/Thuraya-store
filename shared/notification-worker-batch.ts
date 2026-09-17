/**
 * Keeps a worker batch moving when one provider transport or result write is
 * unavailable. A false commit is a valid stale-attempt response; only a thrown
 * write is counted as persistence failure. Neither state is an acceptance.
 */
export type NotificationJobOutcome={accepted:boolean;persistenceFailures:number};
export async function persistNotificationResult(write:()=>Promise<boolean>){
 try{return {committed:await write(),persistenceFailed:false}}catch{return {committed:false,persistenceFailed:true}}
}
export async function runNotificationBatch<T>(jobs:readonly T[],process:(job:T)=>Promise<NotificationJobOutcome>){
 let accepted=0;let persistenceFailures=0;let internalFailures=0;
 for(const job of jobs){
  try{const outcome=await process(job);if(outcome.accepted)accepted++;persistenceFailures+=outcome.persistenceFailures}
  catch{internalFailures++}
 }
 return {processed:jobs.length,accepted,persistenceFailures,internalFailures};
}
