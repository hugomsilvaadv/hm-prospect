import { createHash } from 'node:crypto';

export const SOCIAL_FORMATS = ['carrossel', 'reel', 'imagem', 'story'] as const;
export type SocialFormat = (typeof SOCIAL_FORMATS)[number];
export const SOCIAL_STATUSES = ['draft', 'pending_review', 'approved', 'rejected'] as const;
export type SocialStatus = (typeof SOCIAL_STATUSES)[number];
export type SocialContent = {
  title: string; format: SocialFormat; topic: string; hook: string;
  caption: string; visualBrief: string; hashtags: string; scheduledAt: number | null;
};
export function bounded(v: unknown, length: number): string {
  return String(v ?? '').trim().slice(0, length);
}
export function asFormat(v: unknown): SocialFormat {
  return SOCIAL_FORMATS.includes(v as SocialFormat) ? v as SocialFormat : 'carrossel';
}
export function requireContent(c: SocialContent): SocialContent {
  if (!c.title.trim() || !c.topic.trim() || !c.caption.trim()) {
    throw new Error('Título, assunto e legenda são obrigatórios.');
  }
  if (c.title.length > 140 || c.topic.length > 300 || c.hook.length > 500 ||
      c.caption.length > 2200 || c.visualBrief.length > 1500 || c.hashtags.length > 500)
    throw new Error('Texto excede o limite permitido.');
  if (c.scheduledAt !== null && (!Number.isSafeInteger(c.scheduledAt) || c.scheduledAt < 0))
    throw new Error('Data inválida.');
  return c;
}
export function parseLocalSchedule(v: unknown): number | null {
  const s = bounded(v, 40);
  if (!s) return null;
  const m = /^(\d{4})-(\d\d)-(\d\d)T(\d\d):(\d\d)$/.exec(s);
  if (!m) throw new Error('Data e hora inválidas.');
  const [,yy,mm,dd,hh,mi] = m.map(String);
  const y=Number(yy), month=Number(mm), day=Number(dd), hour=Number(hh), minute=Number(mi);
  const local = new Date(Date.UTC(y,month-1,day,hour,minute));
  if (local.getUTCFullYear()!==y || local.getUTCMonth()+1!==month ||
      local.getUTCDate()!==day || local.getUTCHours()!==hour ||
      local.getUTCMinutes()!==minute) throw new Error('Data inválida.');
  // Operação em São Paulo; o -03 é explícito até integração de fuso horário.
  return Date.UTC(y,month-1,day,hour+3,minute);
}
export function nextStatus(s: SocialStatus, action: 'submit'|'approve'|'reject'|'revise'): SocialStatus {
  const transitions: Record<SocialStatus, Partial<Record<typeof action,SocialStatus>>> = {
    draft: {submit:'pending_review',revise:'draft'},
    pending_review: {approve:'approved',reject:'rejected',revise:'draft'},
    approved: {revise:'draft'},
    rejected: {revise:'draft',submit:'pending_review'}
  };
  const next = transitions[s][action];
  if (!next) throw new Error('Transição proibida: '+s+' -> '+action);
  return next;
}
export function contentFingerprint(c: SocialContent): string {
  return createHash('sha256').update(JSON.stringify([
    c.title,c.format,c.topic,c.hook,c.caption,c.visualBrief,c.hashtags,c.scheduledAt
  ])).digest('hex');
}
export function requireApprovedForPublishing(s: SocialStatus, fingerprint: string|null, c: SocialContent): void {
  if (s !== 'approved' || !fingerprint || fingerprint !== contentFingerprint(c))
    throw new Error('Publicação bloqueada: não existe aprovação válida para o conteúdo atual.');
}
