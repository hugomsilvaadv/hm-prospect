'use server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { sqlite } from '@/db/client';
import { queueJob, logEvent, setPaused } from '@/lib/jobs';
import { getBusiness } from '@/lib/business';
import { normalizeHandle, scoreLead } from '@/lib/rules';
import { validAdminToken } from '@/lib/security';

async function authenticate():Promise<void>{
 const token=(await cookies()).get('hm_auth')?.value||null;
 if(!validAdminToken(token))throw new Error('Sessão inválida. Entre novamente.');
}
export async function signIn(form:FormData):Promise<void>{
 const supplied=String(form.get('token')||'');
 if(!validAdminToken(supplied))redirect('/login?error=1');
 (await cookies()).set('hm_auth',supplied,{httpOnly:true,sameSite:'strict',secure:process.env.NODE_ENV==='production',path:'/',maxAge:8*60*60});
 redirect('/');
}
export async function signOut():Promise<void>{(await cookies()).delete('hm_auth');redirect('/login');}
export async function createLead(form:FormData):Promise<void>{
 await authenticate();
 const handle=normalizeHandle(String(form.get('handle')||''));
 if(!handle||handle.length<2||handle.length>30)throw new Error('Perfil inválido');
 const segment=String(form.get('segment')||'').slice(0,100);
 const bio=String(form.get('bio')||'').slice(0,1800);
 const displayName=String(form.get('displayName')||'').slice(0,120);
 const flow=form.get('flow')==='affiliates'?'affiliates':'customers';
 const business=getBusiness();
 const score=scoreLead(bio,business.icpKeywords,false);
 const now=Date.now();
 const out=sqlite.prepare("INSERT OR IGNORE INTO leads(handle,display_name,bio,segment,flow,score,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?)")
   .run(handle,displayName,bio,segment,flow,score,now,now);
 if(out.changes)logEvent('lead_discovered',Number(out.lastInsertRowid),{source:'manual'});
 revalidatePath('/');
}
export async function queueDiscovery(form:FormData):Promise<void>{
 await authenticate();
 const keyword=String(form.get('keyword')||'').trim().slice(0,100);
 if(!keyword)throw new Error('Palavra-chave obrigatória');
 queueJob('discover',null,{keyword});
 revalidatePath('/');
}
export async function queueFirstDm(form:FormData):Promise<void>{
 await authenticate();
 const leadId=Number(form.get('leadId'));
 const lead=sqlite.prepare('SELECT id,channel,opted_out FROM leads WHERE id=?').get(leadId) as {id:number;channel:string;opted_out:number}|undefined;
 if(!lead||lead.opted_out||lead.channel!=='browser_contact_pending')throw new Error('Lead indisponível para abordagem.');
 const exists=sqlite.prepare("SELECT 1 FROM jobs WHERE lead_id=? AND kind='first_dm' AND status IN ('queued','running')").get(leadId);
 if(!exists)queueJob('first_dm',leadId);
 revalidatePath('/');
}
export async function togglePause(form:FormData):Promise<void>{
 await authenticate();setPaused(String(form.get('paused'))!=='false');revalidatePath('/');
}
export async function optOut(form:FormData):Promise<void>{
 await authenticate();
 const id=Number(form.get('leadId')),now=Date.now();
 sqlite.transaction(()=>{
 sqlite.prepare("UPDATE leads SET opted_out=1,channel='do_not_contact',pipeline='closed',updated_at=? WHERE id=?").run(now,id);
 sqlite.prepare("UPDATE jobs SET status='cancelled' WHERE lead_id=? AND status='queued'").run(id);
 logEvent('opt_out',id);
 })();revalidatePath('/');
}
