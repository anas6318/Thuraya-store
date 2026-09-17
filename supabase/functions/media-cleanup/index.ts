import {db,rpc,env,respond} from '../_shared/server.ts';
import {constantTimeEqual} from '../../../shared/logic.ts';
Deno.serve(async req=>{
  if(req.method!=='POST'||!env('MEDIA_CLEANUP_SECRET')||!constantTimeEqual(req.headers.get('authorization')||'',`Bearer ${env('MEDIA_CLEANUP_SECRET')}`))return respond(req,{error:'forbidden'},403);
  try{const jobs=await rpc<{bucket:string;path:string}[]>('thuraya_collect_media_orphans');let removed=0;
    for(const j of jobs){const {error}=await db.storage.from(j.bucket).remove([j.path]);await rpc('thuraya_cleanup_result',{p_bucket:j.bucket,p_path:j.path,p_success:!error});if(!error)removed++}
    return respond(req,{processed:jobs.length,removed});
  }catch{return respond(req,{error:'cleanup_failed'},503)}
});
