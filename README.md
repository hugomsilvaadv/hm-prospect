# HM Prospect

**Status: foundation / incomplete.** Built around the architecture of [Buscando 1 Milhão](https://github.com/soumatheusgomes/buscandomilhao/blob/main/PROMPT.md), adapted for outsourcing B2B receivables administration and collections.

## Stack
Next.js App Router, React, TypeScript strict, Tailwind, SQLite + Drizzle, Playwright CDP, OpenAI, Meta official webhook/messaging API.

## Quick start (local computer)
1. Install Node.js 24 LTS and pnpm.
2. Copy `.env.example` to `.env` and set a long unique `APP_ADMIN_TOKEN`.
3. Copy `config/business.example.json` to `config/business.json`, filling all private information and verified commercial claims.
4. Run `pnpm install`, `pnpm db`, `pnpm dev`.
5. Access http://127.0.0.1:3000 and log in using the admin token.

The interface and lead CRUD are scaffolding; the current worker does **not execute queued jobs**. Browser adapter has a first-DM routine behind `LIVE_SEND_ENABLED=false`, but real delivery is untested. No real messages were sent, no linked Instagram account was accessed, and no live Meta API was exercised.

## Known blockers
- Package installations/build were unavailable in the isolated environment. Generate and commit pnpm-lock.yaml only after a connected pnpm install.
- CDP requires a logged-in Chrome on the operator's own local computer.
- Meta webhooks/API require approved permissions, tokens and sender ID resolution.
- The upstream 19 acceptance criteria are not met. See AGENTS.md.
- This repository is currently **public**. Never commit `.env`, `config/business.json`, session files, customer data, screenshots or secrets.

Business registration and applicable privacy/channel rules should be reviewed before launching collection services or outreach.
