'use server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { validAdminSession } from '@/lib/admin-session';
import {asFormat,bounded,parseLocalSchedule,type SocialContent} from '@/features/social/policy';
import {createSocialPost,reviseSocialPost,transitionSocialPost} from '@/features/social/store';
import { sqlite } from '@/db/client';
import {generateSocialContent} from '@/features/social/generator';

async function authenticate():Promise<void>{
 const token=(await cookies()).get('hm_auth')?.value||null;
 if(!await validAdminSession(token,process.env.APP_ADMIN_TOKEN))throw new Error('Sessão administrativa inválida.');
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

const examples=[
 {title:'3 erros na cobrança empresarial',format:'carrossel',topic:'Organização dos processos de cobrança',hook:'Sua empresa cobra sem estratégia?',caption:'Uma cobrança desorganizada pode desgastar relações comerciais. Comece por três cuidados: registre todos os contatos e acordos; defina uma cadência respeitosa de acompanhamento; acompanhe cada pagamento e vencimento. A recuperação de recebíveis exige processo, clareza e consistência. Sua equipe possui uma rotina estruturada?',visualBrief:'Carrossel com fundo azul-marinho, títulos claros e detalhes em verde-menta.',hashtags:'#GestaoFinanceira #ContasAReceber #CobrancaEmpresarial #Ekpria',scheduledAt:null},
 {title:'Faturamento não é caixa',format:'carrossel',topic:'Fluxo de caixa e contas a receber',hook:'Vender mais não significa receber melhor.',caption:'Uma venda a prazo só se transforma em disponibilidade financeira quando o pagamento é realizado. Acompanhar vencimentos, conciliar recebíveis e agir cedo nos atrasos ajuda a dar previsibilidade ao fluxo de caixa. Como sua empresa acompanha as contas a receber?',visualBrief:'Apresentação minimalista de conceitos de faturamento e recebimento, sem valores inventados.',hashtags:'#FluxoDeCaixa #Recebiveis #GestaoEmpresarial #Ekpria',scheduledAt:null},
 {title:'Cobrança profissional e relacionamento',format:'imagem',topic:'Comunicação profissional na recuperação de crédito',hook:'Cobrar com respeito também é estratégia.',caption:'Uma comunicação objetiva, documentada e respeitosa permite tratar atrasos sem perder de vista o relacionamento comercial. Organize condições possíveis de pagamento e formalize os acordos realizados. A Ekpria acredita em processos claros e consistentes.',visualBrief:'Arte institucional em azul-marinho e verde-menta com mensagem central sobre cobrança responsável.',hashtags:'#CobrancaResponsavel #GestaoDeRecebiveis #Ekpria',scheduledAt:null}
] as const;
export async function createStarterSocialDrafts():Promise<void>{
 await authenticate();
 for(const item of examples){
  const exists=sqlite.prepare('SELECT 1 FROM social_posts WHERE title=? LIMIT 1').get(item.title);
  if(!exists)createSocialPost({...item,format:asFormat(item.format)});
 }
 revalidatePath('/social');redirect('/social?notice=saved');
}
