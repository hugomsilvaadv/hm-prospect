'use server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { validAdminToken } from '@/lib/security';
import {asFormat,bounded,parseLocalSchedule,type SocialContent} from '@/features/social/policy';
import {createSocialPost,reviseSocialPost,transitionSocialPost} from '@/features/social/store';
import {generateSocialContent} from '@/features/social/generator';

async function authenticate():Promise<void>{
 const token=(await cookies()).get('hm_auth')?.value||null;
 if(!validAdminToken(token))throw new Error('Sessão administrativa inválida.');
}
function numberField(form:FormData,field:string):number{
 const n=Number(form.get(field));
 if(!Number.isSafeInteger(n)||n<1)throw new Error('ID ou versão inválida.');
 return n;
}
function contentFrom(form:FormData):SocialContent{
 return {
  title:bounded(form.get('title'),140),format:asFormat(form.get('format')),
  topic:bounded(form.get('topic'),300),hook:bounded(form.get('hook'),500),
  caption:bounded(form.get('caption'),2200),visualBrief:bounded(form.get('visualBrief'),1500),
  hashtags:bounded(form.get('hashtags'),500),scheduledAt:parseLocalSchedule(form.get('scheduledAt'))
 };
}
export async function saveSocialDraft(form:FormData):Promise<void>{
 await authenticate();
 if(form.get('id'))reviseSocialPost(numberField(form,'id'),contentFrom(form),numberField(form,'version'));
 else createSocialPost(contentFrom(form));
 revalidatePath('/social');redirect('/social?notice=saved');
}
export async function createAiSocialDraft(form:FormData):Promise<void>{
 await authenticate();
 const c=await generateSocialContent(String(form.get('topic')||''),String(form.get('format')||''));
 createSocialPost(c,'ai');
 revalidatePath('/social');redirect('/social?notice=generated');
}
export async function reviewSocialDraft(form:FormData):Promise<void>{
 await authenticate();
 const a=form.get('action');
 if(a!=='submit'&&a!=='approve'&&a!=='reject')throw new Error('Ação inválida.');
 transitionSocialPost(numberField(form,'id'),a,numberField(form,'version'));
 revalidatePath('/social');redirect('/social?notice='+a);
}
