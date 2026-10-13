# Implementation instructions

Source specification: https://github.com/soumatheusgomes/buscandomilhao/blob/main/PROMPT.md

The upstream repository is a PROMPT, not a working Instagram agent. Its 19 acceptance criteria remain the target and must be proved by tests before calling the project complete.

Business-specific configuration is in ignored config/business.json only. HM sells outsourced B2B administrative collections and receivables management. Prospecting leads are companies likely to hire HM; never add the debtors of HM clients to this database. Separate this service from legal representation.

Keep the upstream architecture: local Next.js/React/strict TypeScript/Tailwind/Drizzle/SQLite/Playwright CDP/official Meta messaging/OpenAI, a durable job worker, customer and optional affiliate funnels, a PT-BR UI, private secrets, audit trail, opt-out and pause.

Current state: scaffold ONLY. Finish and validate job execution, browser behavior, Meta identification and handoff, conversation state machine, automated experiments, backups, error recovery, auth hardening, tests and build. Do not claim sending or conversion works without evidence.

Real sends must be off by default and require explicit operator approval. Never circumvent an Instagram restriction, forge identity, use a private API or expose the CDP port.
