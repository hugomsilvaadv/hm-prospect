import { sqliteTable, text, integer, real, uniqueIndex, index } from 'drizzle-orm/sqlite-core';

export const leads = sqliteTable('leads', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  handle: text('handle').notNull(),
  displayName: text('display_name').notNull().default(''),
  bio: text('bio').notNull().default(''),
  origin: text('origin').notNull().default('manual'),
  location: text('location').notNull().default(''),
  sourceUrl: text('source_url').notNull().default(''),
  segment: text('segment').notNull().default(''),
  flow: text('flow', { enum: ['customers','affiliates'] }).notNull().default('customers'),
  score: integer('score').notNull().default(0),
  pipeline: text('pipeline').notNull().default('discovered'),
  channel: text('channel').notNull().default('browser_contact_pending'),
  metaUserId: text('meta_user_id'),
  inboundAt: integer('inbound_at'),
  nextActionAt: integer('next_action_at'),
  optedOut: integer('opted_out', { mode:'boolean' }).notNull().default(false),
  lastError: text('last_error'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull()
}, t => [uniqueIndex('lead_handle_unique').on(t.handle), index('lead_meta_idx').on(t.metaUserId)]);

export const messages = sqliteTable('messages', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  leadId: integer('lead_id').notNull().references(() => leads.id),
  externalId: text('external_id'),
  direction: text('direction').notNull(),
  channel: text('channel').notNull(),
  body: text('body').notNull(),
  variant: text('variant').notNull().default('baseline'),
  createdAt: integer('created_at').notNull()
}, t => [uniqueIndex('external_id_unique').on(t.externalId)]);

export const jobs = sqliteTable('jobs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  kind: text('kind').notNull(),
  leadId: integer('lead_id').references(() => leads.id),
  payload: text('payload').notNull().default('{}'),
  status: text('status').notNull().default('queued'),
  dueAt: integer('due_at').notNull(),
  attempts: integer('attempts').notNull().default(0),
  lastError: text('last_error'),
  createdAt: integer('created_at').notNull()
}, t => [index('job_status_due_idx').on(t.status,t.dueAt)]);

export const events = sqliteTable('events', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  leadId: integer('lead_id').references(() => leads.id),
  type: text('type').notNull(),
  detail: text('detail').notNull().default('{}'),
  createdAt: integer('created_at').notNull()
});
export const system = sqliteTable('system', { key: text('key').primaryKey(), value: text('value').notNull() });
export const aiCalls = sqliteTable('ai_calls', {
  id: integer('id').primaryKey({autoIncrement:true}),
  leadId: integer('lead_id').references(()=>leads.id),
  model: text('model').notNull(),
  promptTokens: integer('prompt_tokens').notNull().default(0),
  completionTokens: integer('completion_tokens').notNull().default(0),
  estimatedCostUsd: real('estimated_cost_usd').notNull().default(0),
  createdAt: integer('created_at').notNull()
});
export const experiments = sqliteTable('experiments', {
 id: integer('id').primaryKey({autoIncrement:true}),
 name: text('name').notNull(),
 variantA: text('variant_a').notNull(),
 variantB: text('variant_b').notNull(),
 enabled: integer('enabled',{mode:'boolean'}).notNull().default(false)
});
export const webhookEvents = sqliteTable('webhook_events',{
 id: text('id').primaryKey(),
 receivedAt: integer('received_at').notNull()
});
