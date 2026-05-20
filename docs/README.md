# ScoutLane Documentation

Use this directory as the project handoff and implementation reference. These docs merge the downloaded project notes with the current repository state as of 2026-05-19.

## Core Docs

| Doc | Purpose |
|---|---|
| [ASSESSMENT-PROGRESS.md](./ASSESSMENT-PROGRESS.md) | Requirement-by-requirement progress, in-process work, and missing gaps against the take-home assessment. |
| [PROJECT-GUIDE.md](./PROJECT-GUIDE.md) | Product overview, user flows, feature inventory, and demo guide. |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System topology, module boundaries, auth, data model, and sharp edges. |
| [API.md](./API.md) | REST endpoints, Server Actions, request/response shapes, and integration payloads. |
| [SECURITY-AUDIT.md](./SECURITY-AUDIT.md) | Evidence-based security posture, current risks, and hardening checklist. |
| [STACK.md](./STACK.md) | Current framework, dependency, runtime, and environment reference. |
| [INTEGRATIONS.md](./INTEGRATIONS.md) | External services: auth, database, storage, email, AI, webhooks, workers. |
| [TESTING.md](./TESTING.md) | Unit, API, component, and E2E testing strategy. |
| [UX-TEST-PROTOCOL.md](./UX-TEST-PROTOCOL.md) | Automated and moderated UX validation protocol. |
| [HANDOFF.md](./HANDOFF.md) | Current branch state, verification notes, and next recommended actions. |
| [CLAUDE.md](./CLAUDE.md) | Claude/agent operating context for this project. |
| [session-reports/2026-05-19-docs-update.md](./session-reports/2026-05-19-docs-update.md) | Session summary for the docs-update branch and next-agent handoff. |

## Source of Truth Rule

When docs disagree with code, trust the code and update the doc in the same change. The highest-risk drift points are API implementation status, auth role gates, worker behavior, test coverage, and the AI provider.

## Tracking Rule

The docs branch intentionally ignores `/docs/*` by default and whitelists only curated documentation in `.gitignore`. Local drafts can stay on disk without appearing in Git. If a new doc becomes part of the curated package, add it to the whitelist and link it here.
