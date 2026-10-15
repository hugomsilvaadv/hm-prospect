import Link from 'next/link';
import './social.css';
import {createAiSocialDraft,reviewSocialDraft,saveSocialDraft} from './actions';
import {listSocialPosts,socialStats,type SocialPost} from '@/features/social/store';
export const dynamic='force-dynamic';

const names={draft:'Rascunho',pending_review:'Aguardando aprovação',approved:'Aprovado',rejected:'Rejeitado'} as const;
const notices:Record<string,string>={saved:'Rascunho salvo.',generated:'A IA criou um rascunho para sua revisão.',submit:'Enviado para revisão.',approve:'Aprovado internamente. NÃO foi publicado.',reject:'Conteúdo rejeitado.'};
function localDate(timestamp:number|null):string{
 return timestamp?new Date(timestamp-3*3600000).toISOString().slice(0,16):'';
}
function FormatSelect({value}:{value?:string}){
 return <select name="format" defaultValue={value||'carrossel'}>
  <option value="carrossel">Carrossel</option><option value="reel">Reel</option>
  <option value="imagem">Imagem</option><option value="story">Story</option>
 </select>;
}
function Post({p}:{p:SocialPost}){
 return <article className="sa-card">
  <div className="sa-headline"><div><small>{p.format.toUpperCase()} · {p.origin==='ai'?'IA':'MANUAL'} · #{p.id}</small><h3>{p.title}</h3></div><span className={'sa-state '+p.status}>{names[p.status]}</span></div>
  <p className="sa-muted">{p.topic}</p>
  <div className="sa-preview"><strong>{p.hook}</strong><p>{p.caption}</p><small>{p.hashtags}</small></div>
  {p.scheduledAt!==null&&<p className="sa-muted">Planejado: {new Date(p.scheduledAt).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'})}</p>}
  <details><summary>Revisar ou editar texto</summary>
   <form className="sa-form" action={saveSocialDraft}>
    <input type="hidden" name="id" value={p.id}/><input type="hidden" name="version" value={p.version}/>
    <label>Título<input name="title" defaultValue={p.title} maxLength={140} required/></label>
    <label>Formato<FormatSelect value={p.format}/></label>
    <label>Assunto<input name="topic" defaultValue={p.topic} maxLength={300} required/></label>
    <label>Chamada<input name="hook" defaultValue={p.hook} maxLength={500}/></label>
    <label>Legenda<textarea name="caption" defaultValue={p.caption} maxLength={2200} rows={5} required/></label>
    <label>Orientação visual<textarea name="visualBrief" defaultValue={p.visualBrief} maxLength={1500} rows={3}/></label>
    <label>Hashtags<input name="hashtags" defaultValue={p.hashtags} maxLength={500}/></label>
    <label>Data planejada (Brasília)<input type="datetime-local" name="scheduledAt" defaultValue={localDate(p.scheduledAt)}/></label>
    <button className="sa-secondary">Salvar edição {p.status==='approved'?'(revoga aprovação)':''}</button>
   </form>
  </details>
  <div className="sa-buttons">
   {(p.status==='draft'||p.status==='rejected')&&<form action={reviewSocialDraft}><input type="hidden" name="id" value={p.id}/><input type="hidden" name="version" value={p.version}/><input type="hidden" name="action" value="submit"/><button>Enviar para aprovação</button></form>}
   {p.status==='pending_review'&&<>
    <form action={reviewSocialDraft}><input type="hidden" name="id" value={p.id}/><input type="hidden" name="version" value={p.version}/><input type="hidden" name="action" value="approve"/><button className="sa-approve">Aprovar conteúdo</button></form>
    <form action={reviewSocialDraft}><input type="hidden" name="id" value={p.id}/><input type="hidden" name="version" value={p.version}/><input type="hidden" name="action" value="reject"/><button className="sa-secondary">Rejeitar</button></form>
   </>}
   {p.status==='approved'&&<span className="sa-muted">Aprovado internamente. Publicação externa desativada.</span>}
  </div>
 </article>;
}
export default async function Page({searchParams}:{searchParams:Promise<{notice?:string}>}){
 const {notice}=await searchParams, posts=listSocialPosts(), stats=socialStats();
 return <main className="sa-main">
  <header className="sa-top"><div><Link href="/">← Voltar à prospecção</Link><small className="sa-overline">EKPRIA · MARKETING</small><h1>Social AI</h1><p>Produção com IA e aprovação humana obrigatória.</p></div><span className="sa-off">Instagram: publicação desligada</span></header>
  {notice&&notices[notice]&&<p className="sa-message" role="status">{notices[notice]}</p>}
  <section className="sa-stats"><div><small>Total</small><strong>{stats.total}</strong></div><div><small>Rascunhos</small><strong>{stats.drafts??0}</strong></div><div><small>Para aprovar</small><strong>{stats.pending??0}</strong></div><div><small>Aprovados</small><strong>{stats.approved??0}</strong></div></section>
  <div className="sa-columns">
   <section className="sa-card"><h2>Gerar texto com IA</h2><p>A IA cria título, legenda, hashtags e briefing visual. Nenhuma imagem ou postagem real é gerada.</p>
    <form className="sa-form" action={createAiSocialDraft}><label>Sobre qual assunto?<textarea name="topic" minLength={6} maxLength={300} rows={3} required placeholder="3 erros ao cobrar clientes inadimplentes"/></label>
    <label>Formato<FormatSelect/></label><button>Gerar rascunho</button><small>Requer OPENAI_API_KEY; só é executado quando você clicar.</small></form>
   </section>
   <section className="sa-card"><h2>Novo rascunho manual</h2>
    <form className="sa-form" action={saveSocialDraft}>
     <label>Título<input name="title" maxLength={140} required/></label>
     <label>Formato<FormatSelect/></label>
     <label>Assunto<input name="topic" maxLength={300} required/></label>
     <label>Chamada<input name="hook" maxLength={500}/></label>
     <label>Legenda<textarea name="caption" rows={3} maxLength={2200} required/></label>
     <label>Briefing visual<textarea name="visualBrief" rows={2} maxLength={1500}/></label>
     <label>Hashtags<input name="hashtags" maxLength={500}/></label>
     <label>Data prevista (opcional)<input name="scheduledAt" type="datetime-local"/></label>
     <button className="sa-secondary">Salvar rascunho</button>
    </form>
   </section>
  </div>
  <section className="sa-list"><h2>Fila editorial</h2><p>Revise e aprove cada conteúdo. O Instagram não receberá publicações nesta versão.</p>
   {posts.length?<div className="sa-posts">{posts.map(p=><Post key={p.id} p={p}/>)}</div>:<div className="sa-empty">Nenhuma publicação ainda. Crie um rascunho para começar.</div>}
  </section>
 </main>;
}
