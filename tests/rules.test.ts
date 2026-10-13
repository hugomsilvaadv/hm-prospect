import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeHandle, scoreLead, canMove, canSend } from '../src/lib/rules';
import { inBusinessHours } from '../src/lib/security';

test('dedupe by normalized Instagram handle', () => {
 assert.equal(normalizeHandle('@Loja.SP'), 'loja.sp');
 assert.equal(normalizeHandle('loja.sp'), 'loja.sp');
});
test('pipeline rejects illegal jumps', () => {
 assert.equal(canMove('discovered', 'qualified'), true);
 assert.equal(canMove('discovered', 'active_customer'), false);
});
test('global pause and opt-out block sends', () => {
 assert.equal(canSend('browser_contact_pending', true, false), false);
 assert.equal(canSend('browser_contact_pending', false, true), false);
 assert.equal(canSend('api_active', false, false), false);
});
test('score has bound', () => assert.equal(scoreLead('Atacado e distribuidora', ['Atacado', 'distribuidora'], true), 70));
test('working hours in Brazil', () => {
 assert.equal(inBusinessHours(new Date('2026-10-12T15:00:00Z'), 'America/Sao_Paulo', '09:00-20:00'), true);
 assert.equal(inBusinessHours(new Date('2026-10-12T05:00:00Z'), 'America/Sao_Paulo', '09:00-20:00'), false);
});
