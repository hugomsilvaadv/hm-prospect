import { sqlite } from '@/db/client';
import { createLead, importProspects, queueDiscovery, queueFirstDm, togglePause, optOut, signOut } from '@/app/actions';
import { pipelineLabels,channelLabels, type Pipeline,type Channel } from '@/lib/rules';
import { isPaused } from '@/lib/jobs';
export const dynamic='force-dynamic';
type Lead={id:number;handle:string;display_name:string;segment:string;location:string;origin:string;score:number;flow:string;pipeline:Pipeline;channel:Channel;opted_out:number};
export default async function Dashboard({searchParams}:{searchParams:Promise<{imported?:string;skipped?:string}>}){
 const notice=await searchParams;
 const leads=sqlite.prepare('SELECT id,handle,display_name,segment,location,origin,score,flow,pipeline,channel,opted_out FROM leads ORDER BY opted_out ASC,score DESC,id DESC LIMIT 100').all() as Lead[];
 const counts=sqlite.prepare("SELECT (SELECT COUNT(*) FROM leads) AS total,(SELECT COUNT(*) FROM leads WHERE pipeline='interested') AS interested,(SELECT COUNT(*) FROM jobs WHERE status='queued') AS queued,(SELECT COUNT(*) FROM leads WHERE opted_out=1) AS opted_out").get() as {total:number;interested:number;queued:number;opted_out:number};
 const spent=sqlite.prepare('SELECT COALESCE(SUM(estimated_cost_usd),0) AS total FROM ai_calls').get() as {total:number};
 const events=sqlite.prepare('SELECT type,lead_id,created_at FROM events ORDER BY id DESC LIMIT 10').all() as {type:string;lead_id:number|null;created_at:number}[];
 const paused=isPaused();
 return <main><header><div><small>PAINEL COMERCIAL • EXECUÇÃO LOCAL</small><h1>EKPRIA Prospect</h1><p>Captação B2B → qualificação → reunião → proposta</p></div><form action={signOut}><button className="minor">Sair</button></form></header>
 {notice.imported!==undefined&&<section className="panel" role="status"><strong>Importação concluída:</strong> {Number(notice.imported)||0} novos perfis e {Number(notice.skipped)||0} ignorados ou já cadastrados.</section>}
 <section className="stats">
  <div className="panel"><small>Empresas e perfis</small><strong>{counts.total}</strong></div>
  <div className="panel"><small>Interessados</small><strong>{counts.interested}</strong></div>
  <div className="panel"><small>Trabalhos na fila</small><strong>{counts.queued}</strong></div>
  <div className="panel"><small>Custos estimados de IA*</small><strong>US$ {spent.total.toFixed(2)}</strong></div>
 </section>
 <section className="panel"><h2>Controle geral</h2><p>{paused?'Sistema pausado — nenhum envio automático será realizado.':'Sistema ativo — tarefas respeitam limites, horários e bloqueios.'}</p>
 <form action={togglePause}><input name="paused" type="hidden" value={paused?'false':'true'}/><button className={paused?'':'warn'}>{paused?'Retomar operações':'Pausar tudo'}</button></form>
 <small>* Estimativa depende dos valores configurados de custo por modelo. Contatos bloqueados: {counts.opted_out}.</small></section>
 <div className="two">
 <section className="panel"><h2>Adicionar empresa ou perfil</h2><form action={createLead}>
 <label htmlFor="handle">Usuário no Instagram</label><input id="handle" name="handle" placeholder="@empresa" required/>
 <label htmlFor="displayName">Nome comercial</label><input id="displayName" name="displayName"/>
 <label htmlFor="segment">Segmento</label><input id="segment" name="segment" placeholder="Distribuidora, atacadista..."/>
 <label htmlFor="location">Cidade ou região</label><input id="location" name="location" placeholder="Ribeirão Preto" />
 <label htmlFor="bio">Biografia pública</label><textarea id="bio" name="bio" rows={3}/>
 <label htmlFor="flow">Funil</label><select id="flow" name="flow"><option value="customers">Empresas contratantes</option><option value="affiliates">Parceiros comerciais</option></select>
 <button>Adicionar perfil</button></form></section>
 <section className="panel"><h2>Descoberta pelo Instagram</h2><p>Pesquisa perfis por palavra-chave no Chrome já logado.</p>
 <form action={queueDiscovery}><label htmlFor="keyword">Palavra-chave</label><input id="keyword" name="keyword" placeholder="distribuidora Ribeirão Preto" required/><button>Colocar pesquisa na fila</button></form>
 <h2>Atividade recente</h2>{events.length?events.map((x,i)=><p key={i}><small>{new Date(x.created_at).toLocaleString('pt-BR')} · {x.type} {x.lead_id?'(#'+x.lead_id+')':''}</small></p>):<p>Nenhum evento registrado.</p>}
 </section></div>
 <section className="panel"><h2>Importar empresas em lote (CSV)</h2>
 <p>Importe até 250 perfis empresariais por arquivo. O sistema compara o público-alvo e preserva os contatos marcados como “Não contatar”. Não envie dados de devedores.</p>
 <form action={importProspects}>
 <label htmlFor="file">Arquivo CSV (até 256 KB)</label><input id="file" type="file" name="file" accept=".csv,text/csv" required />
 <button>Importar e qualificar empresas</button></form>
 <small>Colunas aceitas: instagram, nome, segmento, cidade, bio e fonte. Uma linha por empresa.</small>
 </section>
 <section className="panel"><h2>Carteira comercial</h2><div className="scroll"><table><thead><tr><th>Perfil</th><th>Segmento</th><th>Região</th><th>Aderência</th><th>Funil</th><th>Etapa</th><th>Canal</th><th>Ações</th></tr></thead><tbody>
 {leads.map(l=><tr key={l.id}><td><a target="_blank" rel="noreferrer" href={'https://www.instagram.com/'+encodeURIComponent(l.handle)+'/'}>@{l.handle}</a><br/><small>{l.display_name}</small></td>
 <td>{l.segment||'—'}</td><td>{l.location||'—'}</td><td><strong>{l.score}/100</strong><br/><small>{l.score>=70?'Alta':l.score>=40?'Média':'Baixa'}</small></td><td>{l.flow==='customers'?'Empresas':'Parceiros'}</td>
 <td><span className="tag">{pipelineLabels[l.pipeline]||l.pipeline}</span></td><td>{channelLabels[l.channel]||l.channel}</td>
 <td>{!l.opted_out&&l.channel==='browser_contact_pending'&&<form action={queueFirstDm}><input type="hidden" name="leadId" value={l.id}/><button className="minor">Agendar DM</button></form>}
 {!l.opted_out&&<form action={optOut}><input type="hidden" name="leadId" value={l.id}/><button className="warn">Não contatar</button></form>}</td></tr>)}
 </tbody></table>{!leads.length&&<p>Nenhum perfil encontrado. Cadastre um perfil ou inicie uma pesquisa.</p>}</div></section>
 </main>;
}
