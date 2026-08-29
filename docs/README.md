# ScoutLane Documentation

Use this directory as the project handoff and implementation reference. Start with the handoff-tree father `docs/handoff/HANDOFF.md` in every new agent session.

## Fast Context Workflow

1. Open `docs/handoff/HANDOFF.md` (the handoff-tree father).
2. Read its current-state section and `Session index`.
3. Open only the session folders (`docs/handoff/<YYYY-MM-DD>-<name>/HANDOFF.md`) needed for the current task.
4. Use the deeper docs below when implementation details are needed.

## Core Docs

| Doc | Purpose |
|---|---|
| `docs/handoff/HANDOFF.md` (git-ignored) | Handoff-tree father: current state, session index, and next-agent context. |
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

## Session Handoff Tree

Session reports were replaced by the append-only handoff tree under `docs/handoff/`: a father `docs/handoff/HANDOFF.md` plus one folder per meaningful work session at `docs/handoff/<YYYY-MM-DD>-<name>/HANDOFF.md`. The tree is git-ignored by design (local-first), so it is not tracked in this repo — record session work there and update the father's `## Current state` + `## Session index` (append, never overwrite).

## Source Of Truth Rule

When docs disagree with code, trust the code and update the doc in the same change. The highest-risk drift points are API implementation status, auth role gates, worker behavior, test coverage, and AI provider behavior.

## Tracking Rule

The docs directory is curated. Keep durable agent context in the handoff tree under `docs/handoff/` (git-ignored, local-first); leave ad-hoc local drafts outside the tracked docs set.
