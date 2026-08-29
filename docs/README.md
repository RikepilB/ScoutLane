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
| [PRODUCT-SPEC.md](./PRODUCT-SPEC.md) | **Current product spec** — personas, features, auth, demo script, spec divergences. |
| [PROJECT-GUIDE.md](./PROJECT-GUIDE.md) | Product overview, user flows, feature inventory, and demo guide. |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System topology, module boundaries, auth, data model, and sharp edges. |
| [API.md](./API.md) | REST endpoints, Server Actions, request/response shapes, and integration payloads. |
| [STACK.md](./STACK.md) | Current framework, dependency, runtime, and environment reference. |
| [INTEGRATIONS.md](./INTEGRATIONS.md) | External services: auth, database, storage, email, AI, webhooks, workers. |
| [TESTING.md](./TESTING.md) | Unit, API, component, and E2E testing strategy. |
| [UX-TEST-PROTOCOL.md](./UX-TEST-PROTOCOL.md) | Automated and moderated UX validation protocol. |
| [ASSESSMENT-PROGRESS.md](./ASSESSMENT-PROGRESS.md) | Take-home requirement scoreboard vs archived [spec](./archive/spec-v1-take-home-draft.md). |
| [SECURITY-AUDIT.md](./SECURITY-AUDIT.md) | Security evidence, remaining risk, and next proof needed. |
| [CLAUDE.md](./CLAUDE.md) | Claude/agent operating context for this project. |

## Session Handoff

Durable agent context lives in the append-only [handoff tree](./handoff/). For every meaningful
work session, add `docs/handoff/<YYYY-MM-DD>-<name>/HANDOFF.md`, then update the rolling
[father handoff](./handoff/HANDOFF.md) with the current state and a new session-index entry.

See [the handoff template](./handoff/_meta/TEMPLATE.md) for the required record format.

## Source Of Truth Rule

When docs disagree with code, trust the code and update the doc in the same change. The highest-risk drift points are API implementation status, auth role gates, worker behavior, test coverage, and AI provider behavior.

## Tracking Rule

The docs directory is curated. Keep durable agent context in `docs/handoff/`; leave ad-hoc local
drafts outside the tracked docs set.
