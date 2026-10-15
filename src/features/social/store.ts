import { sqlite } from '@/db/client';
import {contentFingerprint,nextStatus,requireContent,type SocialContent,type SocialStatus,type SocialFormat} from './policy';

export type SocialPost = SocialContent & {
 id:number;status:SocialStatus;version:number;origin:'manual'|'ai';
 approvedFingerprint:string|null;approvedAt:number|null;createdAt:number;updatedAt:number;
};
type Row = {id:number;title:string;format:SocialFormat;topic:string;hook:string;caption:string;
 visual_brief:string;hashtags:string;scheduled_at:number|null;status:SocialStatus;
 approved_fingerprint:string|null;approved_at:number|null;created_at:number;updated_at:number;
 version:number;origin:'manual'|'ai'};
function fromRow(r:Row):SocialPost {
 return {id:r.id,title:r.title,format:r.format,topic:r.topic,hook:r.hook,caption:r.caption,
  visualBrief:r.visual_brief,hashtags:r.hashtags,scheduledAt:r.scheduled_at,status:r.status,
  approvedFingerprint:r.approved_fingerprint,approvedAt:r.approved_at,version:r.version,
  origin:r.origin,createdAt:r.created_at,updatedAt:r.updated_at};
}
function audit(id:number,action:string,from:SocialStatus|null,to:SocialStatus,detail:object,at:number) {
 sqlite.prepare('INSERT INTO social_audit(post_id,action,from_status,to_status,detail,happened_at) VALUES(?,?,?,?,?,?)')
  .run(id,action,from,to,JSON.stringify(detail),at);
}
function getPost(id:number):SocialPost {
 if(!Number.isSafeInteger(id)||id<1)throw new Error('ID inválido.');
 const row=sqlite.prepare('SELECT * FROM social_posts WHERE id=?').get(id) as Row|undefined;
 if(!row)throw new Error('Conteúdo não encontrado.');
 return fromRow(row);
}
export function listSocialPosts():SocialPost[] {
 return (sqlite.prepare('SELECT * FROM social_posts ORDER BY created_at DESC,id DESC LIMIT 150').all() as Row[]).map(fromRow);
}
export function createSocialPost(c:SocialContent,origin:'ai'|'manual'='manual'):number {
 requireContent(c);const now=Date.now();
 return sqlite.transaction(()=>{
  const r=sqlite.prepare('INSERT INTO social_posts(title,format,topic,hook,caption,visual_brief,hashtags,scheduled_at,created_at,updated_at,origin) VALUES(?,?,?,?,?,?,?,?,?,?,?)')
   .run(c.title,c.format,c.topic,c.hook,c.caption,c.visualBrief,c.hashtags,c.scheduledAt,now,now,origin);
  const id=Number(r.lastInsertRowid);audit(id,'created',null,'draft',{origin},now);return id;
 })();
}
export function reviseSocialPost(id:number,c:SocialContent,expected:number):void {
 requireContent(c);
 sqlite.transaction(()=>{
  const previous=getPost(id);if(previous.version!==expected)throw new Error('Versão desatualizada. Recarregue a página.');
  const next=nextStatus(previous.status,'revise'),now=Date.now();
  const result=sqlite.prepare('UPDATE social_posts SET title=?,format=?,topic=?,hook=?,caption=?,visual_brief=?,hashtags=?,scheduled_at=?,status=?,approved_fingerprint=NULL,approved_at=NULL,version=version+1,updated_at=? WHERE id=? AND version=?')
   .run(c.title,c.format,c.topic,c.hook,c.caption,c.visualBrief,c.hashtags,c.scheduledAt,next,now,id,expected);
  if(result.changes!==1)throw new Error('Conflito de edição.');
  audit(id,'revised',previous.status,next,{approvalRevoked:previous.status==='approved'},now);
 })();
}
export function transitionSocialPost(id:number,action:'submit'|'approve'|'reject',expected:number):void {
 sqlite.transaction(()=>{
  const previous=getPost(id);if(previous.version!==expected)throw new Error('Versão desatualizada. Recarregue a página.');
  const next=nextStatus(previous.status,action),now=Date.now();
  const fingerprint=action==='approve'?contentFingerprint(previous):null;
  const result=sqlite.prepare('UPDATE social_posts SET status=?,approved_fingerprint=?,approved_at=?,updated_at=?,version=version+1 WHERE id=? AND version=?')
   .run(next,fingerprint,action==='approve'?now:null,now,id,expected);
  if(result.changes!==1)throw new Error('Conflito de aprovação.');
  audit(id,action,previous.status,next,{fingerprint},now);
 })();
}
export function socialStats(){
 return sqlite.prepare("SELECT COUNT(*) AS total, SUM(CASE WHEN status='draft' THEN 1 ELSE 0 END) AS drafts, SUM(CASE WHEN status='pending_review' THEN 1 ELSE 0 END) AS pending, SUM(CASE WHEN status='approved' THEN 1 ELSE 0 END) AS approved FROM social_posts")
  .get() as {total:number;drafts:number|null;pending:number|null;approved:number|null};
}
