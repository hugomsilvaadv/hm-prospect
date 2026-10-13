export type Pipeline = 'discovered' | 'qualified' | 'contacted' | 'replied' | 'interested' | 'whatsapp_handoff' | 'registered' | 'active_customer' | 'joined_affiliate_group' | 'active_affiliate' | 'generated_customer' | 'closed';
export type Channel = 'browser_contact_pending' | 'browser_contact_sent' | 'waiting_inbound_reply' | 'api_eligible' | 'api_active' | 'api_window_closed' | 'human_review_required' | 'do_not_contact' | 'blocked' | 'completed';

export const pipelineLabels: Record<Pipeline, string> = {
  discovered:'Descoberto', qualified:'Qualificado', contacted:'Abordado', replied:'Respondeu',
  interested:'Interessado', whatsapp_handoff:'Encaminhado ao WhatsApp', registered:'Cadastrado',
  active_customer:'Cliente ativo', joined_affiliate_group:'Entrou no grupo de parceiros',
  active_affiliate:'Parceiro ativo', generated_customer:'Gerou cliente', closed:'Encerrado'
};
export const channelLabels: Record<Channel, string> = {
  browser_contact_pending:'Pendente no navegador', browser_contact_sent:'Enviado no navegador',
  waiting_inbound_reply:'Aguardando resposta', api_eligible:'Elegível para API',
  api_active:'API ativa', api_window_closed:'Janela da API encerrada',
  human_review_required:'Revisão humana', do_not_contact:'Não contatar',
  blocked:'Bloqueado', completed:'Concluído'
};
const transitions: Record<Pipeline, Pipeline[]> = {
  discovered:['qualified','closed'], qualified:['contacted','closed'], contacted:['replied','closed'],
  replied:['interested','closed'], interested:['whatsapp_handoff','joined_affiliate_group','closed'],
  whatsapp_handoff:['registered','closed'], registered:['active_customer','closed'],
  active_customer:['closed'], joined_affiliate_group:['active_affiliate','closed'],
  active_affiliate:['generated_customer','closed'], generated_customer:['closed'],closed:[]
};
export function canMove(from: Pipeline, to: Pipeline): boolean { return transitions[from].includes(to); }
export function normalizeHandle(value: string): string {
  return value.trim().replace(/^@/, '').toLowerCase().replace(/[^a-z0-9._]/g,'');
}
export function scoreLead(bio: string, keywords: string[], isDecisionMaker: boolean): number {
  const found = keywords.filter(v => bio.toLocaleLowerCase('pt-BR').includes(v.toLocaleLowerCase('pt-BR')));
  return Math.min(100, found.length * 20 + (isDecisionMaker ? 30 : 0));
}
export function canSend(channel: Channel, optedOut: boolean, paused: boolean): boolean {
  return !optedOut && !paused && channel === 'browser_contact_pending';
}
