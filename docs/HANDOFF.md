# ScoutLane Handoff

This compatibility entry point replaces the frozen May 2026 snapshot that previously lived
here. The canonical, append-only project handoff is:

- [`docs/handoff/HANDOFF.md`](./handoff/HANDOFF.md) — rolling current state and session index.
- [`docs/handoff/.current-session`](./handoff/.current-session) — active session pointer used by
  the handoff hooks.
- [`docs/session-reports/`](./session-reports/) — detailed reports for architecture, security,
  auth, parsing, email, subscription, and deployment work.

## Current Worktree Summary

- Branch: `fix/mask-integration-api-key-input`, ahead of its remote by eight local refactor
  commits.
- A large uncommitted hardening set adds guest read-only enforcement, integration/webhook
  security, explicit pipeline-stage status mapping, rate-limit fixes, and custom applicant file
  fields with persisted attachments.
- Fresh 2026-07-18 gates: `pnpm typecheck`, `pnpm test -- --run` (236 passing), `pnpm lint`
  (one pre-existing warning), and `pnpm build` pass.
- `pnpm test:e2e` was attempted but timed out after 184 seconds. Partial artifacts show page and
  navigation timeouts; the run did not emit a final summary or reconfirm the older `P1001` error.
- Nothing in this WIP has been committed, pushed, migrated, seeded, or deployed.

Read the canonical handoff before making larger changes.
