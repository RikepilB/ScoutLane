# ScoutLane Documentation

Use this directory as the project handoff and implementation reference. Start with [HANDOFF.md](./HANDOFF.md) in every new agent session.

## Fast Context Workflow

1. Open [HANDOFF.md](./HANDOFF.md).
2. Read `Read This First`, `Open Issues`, and `Session Index`.
3. Open only the linked session reports needed for the current task.
4. Use the deeper docs below when implementation details are needed.

## Core Docs

| Doc | Purpose |
|---|---|
| [HANDOFF.md](./HANDOFF.md) | Fast current-state index, open issues, session history, and next-agent context. |
| [PROJECT-GUIDE.md](./PROJECT-GUIDE.md) | Product overview, user flows, feature inventory, and demo guide. |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System topology, module boundaries, auth, data model, and sharp edges. |
| [API.md](./API.md) | REST endpoints, Server Actions, request/response shapes, and integration payloads. |
| [STACK.md](./STACK.md) | Current framework, dependency, runtime, and environment reference. |
| [INTEGRATIONS.md](./INTEGRATIONS.md) | External services: auth, database, storage, email, AI, webhooks, workers. |
| [TESTING.md](./TESTING.md) | Unit, API, component, and E2E testing strategy. |
| [UX-TEST-PROTOCOL.md](./UX-TEST-PROTOCOL.md) | Automated and moderated UX validation protocol. |
| [ASSESSMENT-PROGRESS.md](./ASSESSMENT-PROGRESS.md) | Take-home requirement scoreboard: done / partial / remaining. |
| [SECURITY-AUDIT.md](./SECURITY-AUDIT.md) | Security evidence, remaining risk, and next proof needed. |
| [CLAUDE.md](./CLAUDE.md) | Claude/agent operating context for this project. |

## Session Reports

Session reports live in [session-reports](./session-reports/). Use one report per meaningful work session.

| Report | Purpose |
|---|---|
| [TEMPLATE.md](./session-reports/TEMPLATE.md) | Copy this structure for future reports. |
| [2026-05-19-docs-review.md](./session-reports/2026-05-19-docs-review.md) | Initial curated docs review context. |
| [2026-05-20-public-job-readability.md](./session-reports/2026-05-20-public-job-readability.md) | Public job page readability work and resume parsing blocker. |
| [2026-05-20-auth-email-notifications-plan.md](./session-reports/2026-05-20-auth-email-notifications-plan.md) | Planned Google auth, OTP, job alerts, and email notifications work. |
| [2026-05-20-handoff-system.md](./session-reports/2026-05-20-handoff-system.md) | Handoff index/session-report system implementation. |
| [2026-05-20-parsing-performance-test.md](./session-reports/2026-05-20-parsing-performance-test.md) | Resume parsing test run, PDF extraction fix, and navigation performance results. |
| [2026-05-20-parsing-ai-engineer-plan.md](./session-reports/2026-05-20-parsing-ai-engineer-plan.md) | Planned OpenRouter fallback parsing fix and AI Engineer seed job/template. |

## Source Of Truth Rule

When docs disagree with code, trust the code and update the doc in the same change. The highest-risk drift points are API implementation status, auth role gates, worker behavior, test coverage, and AI provider behavior.

## Tracking Rule

The docs directory is curated. Keep durable agent context in `HANDOFF.md` and `docs/session-reports/`; leave ad-hoc local drafts outside the tracked docs set.
