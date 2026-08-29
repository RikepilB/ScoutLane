# Goal

Reconcile and document the current ScoutLane worktree after the July 17 code-only hardening pass.
The canonical context lives in `docs/handoff/HANDOFF.md`; this root file is the Stop-hook fallback.

## Current state

- Active branch: `fix/mask-integration-api-key-input`, eight commits ahead of its remote.
- Uncommitted WIP implements guest read-only enforcement, integration/webhook hardening,
  rate-limit fixes, explicit pipeline-stage status mapping, and applicant custom file fields.
- Fresh July 18 verification passes typecheck, 236 tests, lint with one pre-existing warning, and
  production build. E2E timed out after 184 seconds with partial page/navigation timeout artifacts;
  it did not emit a final summary or reconfirm the older PostgreSQL `P1001` error.
- No commit, push, migration deployment, seed run, or production deployment was performed.
- A staged-then-deleted resume-eval design spec belongs to separate user WIP and was not touched.

## Files in flight

- Application/security WIP across `prisma/`, `src/app/`, `src/lib/`, `src/server/`, and tests.
- Current report: `docs/session-reports/2026-07-17-guest-integration-hardening.md`.
- Current session digest: `docs/handoff/2026-07-18-hardening-documentation/HANDOFF.md`.
- `src/lib/webhook/sign.test.ts` — fixed typecheck failure by using `vi.stubEnv` for `NODE_ENV`.

## Changed

- Replaced stale `docs/HANDOFF.md` content with a compatibility pointer and current summary.
- Marked resolved-in-WIP findings in `GAPS.md` without claiming deployment.
- Refreshed the canonical handoff tree and root Stop-hook fallback.

## Failed attempts

- `pnpm test:e2e` timed out after 184 seconds; partial artifacts show page/navigation timeouts and
  the spawned Playwright/Next processes were cleaned up.
- `codex-export -All` ran on 2026-07-18 16:13 and produced manifest
  `C:\Users\a2021\.codex\exports\codex-export-batch-2026-07-18-161326.json`.
  Result: 80 exported, 5 skipped locked, 13 skipped workspace-root, 1 failed because an export
  already existed. It also created very large `docs/handoff/HANDOFF.md` /
  `.handoff-index-*.tmp` files with encoding noise; review before committing or keeping them.

# Next steps

1. Review the uncommitted hardening diff and migration SQL.
2. Diagnose the Playwright startup/navigation timeout with a reachable PostgreSQL test database.
3. Decide whether to keep or clean the giant `docs/handoff/` export integration files.
4. Re-run `codex-export -SessionId <id>` after closing locked sessions if those transcripts matter.
5. Only after approval: commit, push, apply migrations/seed data, and deploy.
