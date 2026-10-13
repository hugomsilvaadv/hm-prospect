import { sqlite } from '../db/client';
import { getBusiness } from '../lib/business';
import { canSend,normalizeHandle,scoreLead } from '../lib/rules';
import { logEvent,isPaused,setPaused } from '../lib/jobs';
import { inBusinessHours } from '../lib/security';
import { discoverProfiles,sendFirstDm } from '../integrations/browser/instagram';
import { decideMessage } from '../integrations/openai/decision';

export type Job={id:number;kind:string;lead_id:number|null;payload:string;attempts:number};
type Lead={id:number;handle:string;bio:string;channel:string;opted_out:number};

export function finish(job:Job,status:string,error:string|null=null,due=Date.now()):void{
 sqlite.prepare('UPDATE jobs SET status=?,last_error=?,due_at=? WHERE id=?').run(status,error,due,job.id);
}
function leadFor(job:Job):Lead{
 if(!job.lead_id)throw new Error('MISSING_LEAD');
 const lead=sqlite.prepare('SELECT id,handle,bio,channel,opted_out FROM leads WHERE id=?').get(job.lead_id) as Lead|undefined;
 if(!lead)throw new Error('LEAD_NOT_FOUND');return lead;
}
async function discover(job:Job):Promise<void>{
 const payload=JSON.parse(job.payload) as {keyword?:string};
 if(!payload.keyword)throw new Error('KEYWORD_MISSING');
 const business=getBusiness();
 const rows=await discoverProfiles(payload.keyword,job.id);
 let created=0;
 for(const candidate of rows){
  const handle=normalizeHandle(candidate.handle);
  if(!handle)continue;
  const now=Date.now();
  const score=scoreLead(candidate.displayName+' '+payload.keyword,business.icpKeywords,false);
  const result=sqlite.prepare('INSERT OR IGNORE INTO leads(handle,display_name,origin,segment,score,created_at,updated_at) VALUES(?,?,?,?,?,?,?)')
   .run(handle,candidate.displayName,'instagram_search:'+payload.keyword,payload.keyword,score,now,now);
  if(result.changes){created++;logEvent('lead_discovered',Number(result.lastInsertRowid),{keyword:payload.keyword});}
 }
 logEvent('discovery_completed',null,{keyword:payload.keyword,found:rows.length,created});
 finish(job,'done');
}
function windowAllowed():boolean{
 return inBusinessHours(new Date(),process.env.OPERATING_TIMEZONE||'America/Sao_Paulo',process.env.OPERATING_HOURS||'09:00-20:00');
}
function sentToday():number{
 const start=Date.now()-86400000;
 const row=sqlite.prepare("SELECT COUNT(*) as count FROM messages WHERE direction='outbound' AND channel='browser' AND created_at>=?").get(start) as {count:number};
 return row.count;
}
async function firstDm(job:Job):Promise<void>{
 const lead=leadFor(job);
 if(!canSend(lead.channel as Parameters<typeof canSend>[0],Boolean(lead.opted_out),isPaused())){finish(job,'done');return;}
 if(!windowAllowed()){finish(job,'queued','outside_operating_hours',Date.now()+3600000);return;}
 const max=Math.min(Number(process.env.MAX_DMS_PER_DAY||30),Number(process.env.MAX_DMS_FIRST_WEEK||5));
 if(sentToday()>=max){finish(job,'queued','daily_limit',Date.now()+86400000);return;}
 const existing=sqlite.prepare("SELECT 1 FROM messages WHERE lead_id=? AND direction='outbound'").get(lead.id);
 if(existing){finish(job,'done');return;}
 const decision=await decideMessage(lead.id,lead.bio,[],true);
 if(decision.action!=='reply'||!decision.message){
  sqlite.prepare("UPDATE leads SET channel='human_review_required',updated_at=? WHERE id=?").run(Date.now(),lead.id);
  logEvent('review_required',lead.id,{intent:decision.intention});
  finish(job,'done');return;
 }
 if(process.env.LIVE_SEND_ENABLED!=='true'){
  logEvent('message_drafted_no_send',lead.id,{jobId:job.id,text:decision.message});
  finish(job,'done');return;
 }
 const result=await sendFirstDm(lead.handle,decision.message,job.id);
 if(result==='dry_run'){finish(job,'done');return;}
 sqlite.transaction(()=>{
  const now=Date.now();
  sqlite.prepare("INSERT INTO messages(lead_id,direction,channel,body,created_at) VALUES(?,?,?,?,?)")
   .run(lead.id,'outbound','browser',decision.message,now);
  sqlite.prepare("UPDATE leads SET channel='waiting_inbound_reply',pipeline='contacted',updated_at=? WHERE id=?").run(now,lead.id);
  logEvent('browser_message_sent',lead.id,{jobId:job.id});
 })();
 finish(job,'done');
}
export async function processJob(job:Job):Promise<void>{
 if(job.kind==='discover')return discover(job);
 if(job.kind==='first_dm')return firstDm(job);
 if(job.kind==='reply'){
  logEvent('human_review_required',job.lead_id,{reason:'Meta mapping and reply handoff not yet validated'});
  finish(job,'done');return;
 }
 if(job.kind==='followup'){logEvent('human_review_required',job.lead_id,{reason:'Follow-up not configured'});finish(job,'done');return;}
 throw new Error('UNKNOWN_JOB_TYPE');
}
export function onJobFailure(job:Job,e:unknown):void{
 const error=String(e).slice(0,400);
 const critical=/CDP|BROWSER|INSTAGRAM|OPENAI|CONFIG_MISSING/.test(error);
 if(critical){setPaused(true);logEvent('circuit_breaker',job.lead_id,{error});}
 logEvent('job_failed',job.lead_id,{jobId:job.id,error});
 finish(job,critical||job.attempts>=3?'failed':'queued',error,Date.now()+60000*(job.attempts+1));
}
