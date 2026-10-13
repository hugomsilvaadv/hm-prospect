# EKPRIA Prospect

**Status: early foundation — not production ready.** This project adapts the architecture of [Buscando 1 Milhão](https://github.com/soumatheusgomes/buscandomilhao/blob/main/PROMPT.md) for prospecting **business clients** interested in outsourcing administrative collections and receivables management to EKPRIA.

## Business identity

EKPRIA is the consumer-facing brand. `hm-prospect` remains the technical repository name. Its public example business configuration is in `config/business.example.json`; actual domain, Instagram handle, WhatsApp link, operator details and verified claims belong only in the ignored `config/business.json`.

Never store account credentials, contact lists, private business data, or debtor records in this public repository. The prospecting database is only for prospective B2B contracting companies.

## Stack

Next.js App Router, React, strict TypeScript, Tailwind, Drizzle / SQLite, Playwright CDP, OpenAI SDK, and Meta official webhook/messaging API. Local worker and web panel.

## Quick start — local operator computer

1. Install Node.js 24 LTS and pnpm.
2. Copy `.env.example` to `.env`, and configure a unique, long `APP_ADMIN_TOKEN`.
3. Copy `config/business.example.json` to `config/business.json`. Fill mandatory fields with confirmed business data; keep unverified claims blocked.
4. Run `pnpm install`, `pnpm db`, `pnpm dev`.
5. Sign in at http://127.0.0.1:3000.
6. Keep live messaging **disabled**. Only consider limited tests after the local Chrome session and platform permissions are configured and validated.

## Current implementation

Database, PT-BR dashboard, manual lead registration, SQLite queue + worker for discovery and queued first approaches, basic CDP adapter, OpenAI classification/drafting and Meta webhook/API foundations. Integration is **incomplete**; no demonstrated real Instagram sends, Meta handoff, or AI-driven campaign optimization. The worker starts paused by default. Initial CI on Node 24 ran migrations, type checking, unit tests and production build successfully; **the upstream 19 acceptance criteria are not satisfied**.

## Remaining work

The next technical work is secure Meta ID reconciliation, webhook/API handoff tests, browser simulations, full follow-up logic, controlled A/B experiments, accurate AI-cost tracking, operator UI and recovery tests. Run `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` and an end-to-end flow before live use; commit a reproducible pnpm lockfile.

See `AGENTS.md`, `SETUP.md` and `docs/EKPRIA_INSTAGRAM_SETUP.md`.

**Compliance:** Business registration/CNAE, contracts, privacy lawful basis, opt-outs and Instagram messaging restrictions need review before outreach.
