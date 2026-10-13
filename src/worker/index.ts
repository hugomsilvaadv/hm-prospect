import '../db/migrate';
import { sqlite } from '../db/client';
import { isPaused,logEvent } from '../lib/jobs';
import { processJob,onJobFailure,type Job } from './handlers';

let running=true;
process.on('SIGINT',()=>{running=false;});
process.on('SIGTERM',()=>{running=false;});
const wait=(ms:number)=>new Promise<void>(r=>setTimeout(r,ms));

function claim():Job|null{
 return sqlite.transaction(()=>{
  const row=sqlite.prepare("SELECT id,kind,lead_id,payload,attempts FROM jobs WHERE status='queued' AND due_at<=? ORDER BY due_at,id LIMIT 1")
    .get(Date.now()) as Job|undefined;
  if(!row)return null;
  const updated=sqlite.prepare("UPDATE jobs SET status='running',attempts=attempts+1 WHERE id=? AND status='queued'").run(row.id);
  return updated.changes?row:null;
 })();
}
async function main():Promise<void>{
 const restarted=sqlite.prepare("UPDATE jobs SET status='queued' WHERE status='running'").run();
 if(restarted.changes)logEvent('worker_recovered_jobs',null,{count:restarted.changes});
 console.info('HM Prospect worker online. Live sending:',process.env.LIVE_SEND_ENABLED==='true'?'enabled':'disabled');
 while(running){
  if(isPaused()){await wait(2500);continue;}
  const job=claim();
  if(!job){await wait(1800);continue;}
  try{await processJob(job);}
  catch(e){onJobFailure(job,e);console.error('Job failed:',job.id,String(e).slice(0,180));}
 }
 sqlite.close();
}
main().catch(e=>{console.error('Worker stopped:',e);process.exitCode=1;});
