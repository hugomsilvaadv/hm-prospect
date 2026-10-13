import { sqlite } from '@/db/client';
export type JobKind = 'discover' | 'first_dm' | 'reply' | 'followup';
export function queueJob(kind: JobKind, leadId: number | null, payload: object = {}, dueAt = Date.now()): number {
 const result = sqlite.prepare('INSERT INTO jobs(kind,lead_id,payload,status,due_at,created_at) VALUES(?,?,?, ?,?,?)')
   .run(kind,leadId,JSON.stringify(payload),'queued',dueAt,Date.now());
 return Number(result.lastInsertRowid);
}
export function logEvent(type: string, leadId: number | null, detail: object = {}): void {
 sqlite.prepare('INSERT INTO events(lead_id,type,detail,created_at) VALUES(?,?,?,?)')
  .run(leadId,type,JSON.stringify(detail),Date.now());
}
export function isPaused(): boolean {
 return (sqlite.prepare("SELECT value FROM system WHERE key='paused'").get() as {value?:string}|undefined)?.value !== 'false';
}
export function setPaused(value: boolean): void {
 sqlite.prepare("INSERT INTO system(key,value) VALUES('paused',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value")
 .run(value?'true':'false');
 logEvent(value?'system_paused':'system_resumed',null);
}
