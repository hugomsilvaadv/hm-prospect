import test from 'node:test';
import assert from 'node:assert/strict';
import { parseProspectCsv } from '../src/features/leads/csv';
import { qualifyCompany } from '../src/features/leads/qualification';

test('imports CSV with semicolons and quoted newlines',()=>{
  const r=parseProspectCsv('instagram;nome;segmento;cidade;bio\n@atacado.test;"Atacado; Ltda";Distribuidora;Ribeirão Preto;"Empresa B2B\natacadista"');
  assert.equal(r.leads.length,1);
  assert.equal(r.leads[0].displayName,'Atacado; Ltda');
  assert.equal(r.leads[0].bio,'Empresa B2B\natacadista');
});
test('normalizes Instagram URLs and deduplicates in the file',()=>{
  const r=parseProspectCsv('handle,nome\nhttps://www.instagram.com/Distribuidora.SP/,Empresa A\n@distribuidora.sp,Empresa B\n@ekpria,Marca própria\nx/ab,Bad');
  assert.equal(r.leads.length,1);
  assert.equal(r.repeatedRows,1);
  assert.equal(r.invalidRows,2);
});
test('rejects malformed CSV and missing handle',()=>{
 assert.throws(()=>parseProspectCsv('empresa;cidade\nX;Y'),/coluna/);
 assert.throws(()=>parseProspectCsv('handle,nome\n"a,bad'),/aspas/);
});
test('qualifies using public commercial signals, not claimed debts',()=>{
 const result=qualifyCompany({
   segment:'Distribuidora de autopeças',bio:'Empresa atacadista B2B',
   location:'Ribeirão Preto',keywords:['atacadista','insumos'],
   targetLocations:['Ribeirão Preto']
 });
 assert.equal(result.priority,'high');
 assert.ok(result.score<=100);
 assert.ok(result.reasons.includes('Região prioritária'));
});
test('does not infer financial distress for an unrelated profile',()=>{
 const result=qualifyCompany({bio:'fotografia e paisagem'});
 assert.equal(result.score,0);
 assert.equal(result.priority,'low');
});
