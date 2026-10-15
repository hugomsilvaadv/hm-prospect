import test from 'node:test';
import assert from 'node:assert/strict';
import {nextStatus,contentFingerprint,requireApprovedForPublishing,parseLocalSchedule,requireContent,type SocialContent} from '../src/features/social/policy';
const c:SocialContent={title:'Fluxo de caixa',format:'carrossel',topic:'Cobrança empresarial',hook:'Você sabe quanto tem a receber?',caption:'Organize sua cobrança com processos transparentes.',visualBrief:'Cards profissionais',hashtags:'#GestaoFinanceira',scheduledAt:null};
test('rascunho não pode ser aprovado antes de entrar na fila',()=>{
 assert.equal(nextStatus('draft','submit'),'pending_review');
 assert.equal(nextStatus('pending_review','approve'),'approved');
 assert.throws(()=>nextStatus('draft','approve'),/Transição proibida/);
 assert.throws(()=>nextStatus('rejected','approve'),/Transição proibida/);
});
test('edição de conteúdo aprovado exige revisão nova',()=>{
 assert.equal(nextStatus('approved','revise'),'draft');
 const fp=contentFingerprint(c);
 requireApprovedForPublishing('approved',fp,c);
 assert.throws(()=>requireApprovedForPublishing('approved',fp,{...c,caption:'Legenda alterada'}),/bloqueada/);
 assert.throws(()=>requireApprovedForPublishing('pending_review',fp,c),/bloqueada/);
});
test('conteúdo obrigatório e data inválida são rejeitados',()=>{
 assert.throws(()=>requireContent({...c,title:''}),/obrigatórios/);
 assert.throws(()=>parseLocalSchedule('amanhã'),/inválidas/);
 assert.throws(()=>parseLocalSchedule('2026-02-30T08:00'),/inválida/);
 assert.equal(parseLocalSchedule('2026-10-20T09:00'),Date.parse('2026-10-20T12:00:00Z'));
});
