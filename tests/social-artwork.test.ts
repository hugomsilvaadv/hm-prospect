import test from 'node:test';
import assert from 'node:assert/strict';
import {slideCount,renderSocialSvg} from '../src/features/social/artwork';
import type {SocialPost} from '../src/features/social/store';

const p:SocialPost={
 id:7,format:'carrossel',title:'<script>alert(1)</script>',topic:'Conferir recebíveis',
 hook:'Estruture a cobrança',caption:'Cobrança responsável e documentada.',
 visualBrief:'Sem promessas de resultados',hashtags:'#Ekpria',scheduledAt:null,
 status:'draft',version:1,origin:'manual',approvedFingerprint:null,approvedAt:null,createdAt:1,updatedAt:1
};
test('carrossel renders four slides, escapes text and watermarks drafts',()=>{
 assert.equal(slideCount(p),4);
 const svg=renderSocialSvg(p,1);
 assert.match(svg,/1080/);
 assert.doesNotMatch(svg,/<script>/);
 assert.match(svg,/RASCUNHO - REVISÃO PENDENTE/);
 assert.throws(()=>renderSocialSvg(p,5));
});
test('approved artwork does not carry the draft watermark',()=>{
 const svg=renderSocialSvg({...p,status:'approved'},2);
 assert.doesNotMatch(svg,/RASCUNHO - REVISÃO PENDENTE/);
});
test('Reels get vertical artwork',()=>{
 assert.equal(slideCount({...p,format:'reel'}),1);
 assert.match(renderSocialSvg({...p,format:'reel'},1),/height="1920"/);
});
