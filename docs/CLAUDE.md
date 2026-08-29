# Claude Project Context

Read this before using Claude Code or another coding agent on ScoutLane.

## Project

ScoutLane is an AI-assisted recruiting platform built with Next.js 16, TypeScript, Prisma/PostgreSQL, Auth.js, OpenRouter, Resend, Google Cloud Storage, and pg-boss.

Current docs worktree: `C:\tmp\ScoutLane-docs-update`

Current branch: `docs-update`

Use this worktree for documentation changes. Do not switch the main OneDrive workspace for this docs branch.

## Required Docs

Before non-trivial work, read the relevant docs:

- Architecture or module boundaries: [ARCHITECTURE.md](./ARCHITECTURE.md)
- REST/API/Server Actions: [API.md](./API.md)
- Dependencies, scripts, env: [STACK.md](./STACK.md)
- External services: [INTEGRATIONS.md](./INTEGRATIONS.md)
- Tests: [TESTING.md](./TESTING.md)
- Security audit/evidence: [SECURITY-AUDIT.md](./SECURITY-AUDIT.md)
- Product behavior and user flows: [PROJECT-GUIDE.md](./PROJECT-GUIDE.md)
- Current handoff tree: `docs/handoff/HANDOFF.md` (father) plus one folder per session at `docs/handoff/<YYYY-MM-DD>-<name>/HANDOFF.md`. The tree is git-ignored and local-first.

## Hard Rules

- Use pnpm only.
- Do not push directly to `master` or `main`.
- Work on a feature/docs branch and open a PR.
- Run `pnpm lint`, `pnpm typecheck`, `pnpm test -- --run`, and `pnpm build` before declaring a code change complete.
- Use `pnpm test:e2e` for final user-flow verification.
- Import Prisma generated types/client from `@/generated/prisma/*`, not `@prisma/client`.
- Keep `auth.config.ts` Edge-safe; do not import Prisma into middleware.
- Keep migrations additive after sharing.
- Keep Server Actions thin and put testable logic in implementation files.
- Update docs when implementation changes.
- For docs work on this branch, use `C:\tmp\ScoutLane-docs-update` and keep output under `/docs`.
- Do not add uncurated local notes to Git. `/docs/*` is ignored by default; only whitelisted docs should be tracked.
- Never claim the app is secure against all vulnerabilities. State evidence, remaining risk, and verification gaps.
- Do not add compliance-framework framing unless the user explicitly asks for it. The current docs should focus on security evidence, assessment readiness, product gaps, architecture, API, testing, and handoff.
- Keep security language precise: say "current evidence," "remaining risk," and "next proof needed."
- Keep root ad-hoc planning files ignored. Curated project docs live in `/docs`.
- If adding any new tracked doc under `/docs`, update `.gitignore`, `docs/README.md`, and this file if agents need to read it.

## Git Workflow

1. Sync from `main`.
2. Create a feature/docs branch.
3. Commit logical changes.
4. Push branch and open PR to `main`.
5. After CI passes and PR merges to `main`, production deployment follows the repo's main/master process.

## Current Agent-Sensitive Areas

- Resume parsing uses OpenRouter through the OpenAI-compatible SDK.
- Resume parsing is async through pg-boss and `pnpm worker:resume`.
- Admin session strategy is JWT.
- Public JSON application submit is not the same as the multipart public apply form.
- Production auth must prove the dev credentials provider is unavailable.
- Middleware is not the only security boundary; Route Handlers and Server Actions must re-check session and ownership.
- Custom form fields are a P0 gap: dropdown options, required validation, and custom file-field behavior need implementation/QA.
- API parity is incomplete: many admin mutations are Server Actions only.
- Security evidence is incomplete: upload hardening, rate limits, security headers, dependency scan, secret scan, and route/action ownership audit still need proof.
- OneDrive can cause local permission errors with dependency binaries; verify in a clean environment if needed.

## Session Handoff Rule

Session context lives in the append-only handoff tree under `docs/handoff/` (git-ignored, local-first). At the end of a large goal, record the session in the tree — append, never overwrite:

1. Write/update this session's `docs/handoff/<YYYY-MM-DD>-<name>/HANDOFF.md`:
   - Goal
   - What landed
   - What is still open
   - Next recommended action
   - Risks/blockers
2. Update the father `docs/handoff/HANDOFF.md`: refresh `## Current state` and append exactly one line under `## Session index` (never delete existing lines).

This supersedes the old `docs/HANDOFF.md` + `docs/session-reports/` system.

## Current Finish Priorities

1. Keep `/docs` curated and commit-ready.
2. Finish or ticket P0 assessment gaps from `ASSESSMENT-PROGRESS.md`.
3. Use `SECURITY-AUDIT.md` as the proof checklist, not as a blanket security guarantee.
4. Verify final demo flow with seeded jobs/applicants, resume parsing, integration logs, CSV export, and clean auth.
5. Commit with a `docs:` Conventional Commit when the curated docs set is reviewed.
