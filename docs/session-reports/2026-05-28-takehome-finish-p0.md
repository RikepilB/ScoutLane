# Session Report — Take-Home Finish P0 (2026-05-28)

## Goal

Verbatim from the user's `/goal`: ship the take-home submission finish plan — restore canonical assessment + security docs (G1), persist dropped job-create fields (G2), resolve the custom file-field type (G3), persist a User row on dev sign-in (G4), production Google OAuth (G5), security audit evidence + rate limit (G6), hosted deploy (G7), Codespaces verify (G8), extend e2e smoke (G9), README + demo + tag (G10).

## What landed (uncommitted — awaiting explicit commit approval)

- **G2** — `src/server/services/jobs/create-impl.ts`: added `slug`, `department`, `whatYouWillDo`, `requirements`, `toolsAndSkills` to the `safeParse` input (they were read at lines 99–111 but never extracted). Replaced placeholder `create-impl.test.ts` with a real mocked test asserting passthrough + slug derivation.
- **G3** — Removed the dead custom `file` field type everywhere: form builder (`form/page.tsx`), `ApplicationForm.tsx`, `careers/[slug]/page.tsx`, `schemas/template.ts` enum, `TemplateEditor.tsx`, `TemplatePreview.tsx`. Resume upload remains the only file mechanism. (`.md` description upload + resume upload untouched.)
- **G4** — Extracted the NextAuth `signIn` callback into `src/lib/auth/sign-in.ts` (`handleSignIn`); dev provider now upserts an ADMIN `User` + reuses/creates an org; DB failure never blocks dev sign-in. `auth.ts` delegates. New `sign-in.test.ts` (6 tests). Keeps Prisma out of `auth.config.ts`.
- **G6** — New `src/lib/rate-limit.ts` (in-memory fixed-window limiter + `clientIpFromHeaders`) with `rate-limit.test.ts` (4 tests). Wired ~10/min/IP into both apply paths: `POST /api/public/jobs/[slug]/applications` and the `submitJobApplication` Server Action. Ran `pnpm audit --prod` (1 high `next` middleware-bypass advisory, patch `16.2.6`; 3 moderate transitive) and a secret scan (clean). Appended an "Evidence Collected — 2026-05-28" section to `docs/SECURITY-AUDIT.md`.
- **G1** — `docs/ASSESSMENT-PROGRESS.md` + `docs/SECURITY-AUDIT.md` already existed on disk but untracked; appended dated scoreboard / evidence sections, whitelisted both in `.gitignore`, added both to `docs/README.md` index.

Gate: `pnpm typecheck` clean · `pnpm lint` clean (1 pre-existing font warning) · `pnpm test -- --run` 124 passing · `pnpm build` succeeds.

- **next bump (DONE)** — `next` 16.2.5 → 16.2.6, closing the high middleware/proxy-bypass advisory (GHSA-26hh-7cqf-hhc6). `pnpm audit --prod` now 3 moderate (transitive `uuid`) only. Commit `7fbe50d`.
- **G9 (DONE)** — `tests/e2e/smoke.spec.ts`: added public-apply-with-resume + admin-applicants-list/CSV tests, a minimal PDF fixture, and `RESUME_PARSE_MODE=queue` in the playwright webServer env so apply submit returns promptly (default mode parses inline via OpenRouter). Also fixed the pre-existing careers-landing test path (`/` not `/careers`). **Full smoke suite 7/7 green** (chromium, workers=1, against a seeded DB). Commit `c5cc90d`.

## What's still open (all user-manual)

- **G5** — GCP OAuth client + Vercel envs (Production + Preview).
- **G7** — Vercel envs + Render workers + Resend; verify end-to-end on hosted URL.
- **G8** — Codespaces cold-clone verify.
- **G10** — README + recorded demo + `v1.0.0-takehome` tag + prod PR.

## Commits (this session)

`3b964a1` G3 file-field · `456662d` G4 dev upsert · `a27251b` G6 rate-limit+audit · `6139594` G1 docs · `7fbe50d` next 16.2.6 bump · `c5cc90d` G9 e2e. (G2 field-drop fix landed inside the external `23f16fc`.)

Final gate: `pnpm typecheck` clean · `pnpm lint` clean (1 pre-existing font warning) · `pnpm test -- --run` 124 passing · `pnpm build` succeeds · `pnpm test:e2e` (chromium) 7/7.

## Next recommended action

All agent-side P0 code is committed and green; hand off to the user for G5/G7/G8/G10 (deploy + demo + tag), then open PR #79 → main.

## Risks/blockers encountered

- `docs/ASSESSMENT-PROGRESS.md` + `SECURITY-AUDIT.md` existed untracked on disk — appended rather than overwrote.
- Uncommitted UI work in flight from a prior session (`admin/jobs/page.tsx`, `applicants/page.tsx`, new `JobCard.tsx`) — left untouched; will stage only this session's files.
- `next` high advisory open (patch available, not yet applied).
