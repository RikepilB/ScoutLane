# ScoutLane Handoff

Last updated: 2026-05-20

## Read This First

Use this file as the first stop for any new agent session. It is the fast index for current repo state, open issues, session history, and reusable local context.

Current snapshot:

| Item | Value |
|---|---|
| Branch | `main` tracking `origin/main` |
| Latest observed commit | `11c4521 fix applicant deletion and resume submission handling` |
| Recently merged PR | `#69 fix: improve resume parsing and handoff docs` |
| Main next task | Fix OpenRouter model fallback parsing and add the AI Engineer seed job/template |
| Working tree note | App fixes for applicant deletion, submission handling, upload guard, custom fields, and parse-now were pushed in `11c4521`; generated `playwright-report/` remains local-only |
| Local app note | Recent local testing used `http://localhost:3009`; use `localhost`, not `127.0.0.1`, for Next dev browser checks |
| Primary test email | `ridi.pillaca@gmail.com` |
| Test resume | `C:\Users\a2021\OneDrive\Escritorio\2026\Toronto\RichardPillaca_RESUME.pdf` |
| Job sample source | `C:\Users\a2021\OneDrive\Escritorio\Vibe projects workspace\PROYECTOS\Documentation\Scoutlane\job post sample.md` |

## Open Issues

| Priority | Area | Symptom | Next Diagnostic Step | Source |
|---|---|---|---|---|
| P1 | Resume parsing | Fixed locally on 2026-05-26: retry parsing now loads app-owned `/api/resumes/...` files directly from local/database storage, and OpenRouter falls back through `openrouter/owl-alpha`, `openrouter/free`, and `openrouter/auto`. | Re-run preview smoke after deploy; keep `OPENROUTER_MODEL=openrouter/owl-alpha` or another known-working model. | `2026-05-26-codex-fixes-notifications-hardening` |
| P1 | AI Engineer seed data | The external job sample has not been added to seed data. | Add one `AI Engineer, Global Security` active job plus one reusable AI Engineer template in `prisma/seed.ts`, based on the sample but branded as ScoutLane demo data. | `2026-05-20-parsing-ai-engineer-plan` |
| P2 | Application submission E2E | Browser submit on `localhost:3009` POSTed successfully and showed application success, but parsing warning remains because of OpenRouter model config. | Re-run after model config fix and email env config. | `2026-05-20-parsing-performance-test` |
| P2 | Email confirmation | Resolved 2026-05-26: `EMAIL_FROM` changed from unverified `noreply@scoutlane.local` to `ScoutLane <onboarding@resend.dev>`. Local dev emails now send via Resend's shared test domain. Free tier limitation: emails only deliver to the Resend account owner's email. | Production needs a verified custom domain. | `2026-05-20-parsing-performance-test` |
| P2 | Auth/dev login | Dev credentials login can return a session without a persisted `User`, which can break admin DB operations. | Upsert the dev user in `src/lib/auth/auth.ts` sign-in callback; keep Prisma out of `auth.config.ts`. | Review findings |
| P2 | Job creation | New-job form fields `slug`, `department`, `whatYouWillDo`, `requirements`, and `toolsAndSkills` can be dropped during parsing. | Add those fields to the `safeParse` input in `createJobImpl`. | Review findings |
| P2 | Public application form | Required custom application fields and select options were fixed in `11c4521`. | Retest on the deployed app after Vercel finishes building. | `11c4521` |
| P2 | Auth/email/notifications | Google auth, email OTP verification, confirmed job alerts, and email-only notifications are planned but not implemented. | Implement the auth/email plan from the session index before production testing. | `2026-05-20-auth-email-notifications-plan` |
| P3 | Lint | `pnpm lint` previously passed with an existing custom font warning in `src/app/layout.tsx`. | Fix separately if polishing final quality gates. | `2026-05-20-public-job-readability` |

## Session Index

| Date | Session Name | Topic | Status | Commit/Branch | Report |
|---|---|---|---|---|---|
| 2026-05-19 | `2026-05-19-docs-review` | Initial curated docs import and docs branch review | Historical | `docs-update` context | [Report](./session-reports/2026-05-19-docs-review.md) |
| 2026-05-20 | `2026-05-20-public-job-readability` | Public job detail/application readability, form contrast, browser checks | Implemented; parsing issue remains | `9569964` then later `f56df75` observed | [Report](./session-reports/2026-05-20-public-job-readability.md) |
| 2026-05-20 | `2026-05-20-auth-email-notifications-plan` | Plan for Google OAuth, email OTP, job alert subscriptions, email notifications, AI Engineer seed data | Planned, not implemented | `feat/redesign` | [Report](./session-reports/2026-05-20-auth-email-notifications-plan.md) |
| 2026-05-20 | `2026-05-20-handoff-system` | Reworked handoff into fast index plus session reports | Implemented | `feat/redesign` | [Report](./session-reports/2026-05-20-handoff-system.md) |
| 2026-05-20 | `2026-05-20-parsing-performance-test` | Ran parsing-focused tests, fixed PDF extraction for `pdf-parse` v2, collected navigation performance | Implemented; E2E submit needs clean retest | `feat/redesign` | [Report](./session-reports/2026-05-20-parsing-performance-test.md) |
| 2026-05-20 | `2026-05-20-parsing-ai-engineer-plan` | Decision-complete plan for OpenRouter fallback parsing and AI Engineer seed job/template | Planned, not implemented | `main` | [Report](./session-reports/2026-05-20-parsing-ai-engineer-plan.md) |

## Current Verified Work

Public job pages were redesigned for readability:

- `/careers/data-scientist`
- `/careers/devops-engineer`

Changed files in that work:

- `src/app/(public)/careers/[slug]/page.tsx`
- `src/components/public/ApplicationForm.tsx`

Verified commands:

```bash
pnpm typecheck
pnpm lint
```

Results:

- `pnpm typecheck` passed.
- `pnpm lint` passed with one existing warning in `src/app/layout.tsx` about custom font loading.
- Browser checks confirmed form labels, inputs, upload area, custom fields, and "About ScoutLane" copy are readable.

## Resume Parsing Diagnostic Checklist

Expected fixed behavior:

- Applicant submission stores a valid `resumeUrl`.
- Applicant detail can open or preview the original resume.
- Parsing status moves from `PENDING` to `PARSING` to `COMPLETED`, or to visible `FAILED` with retry.
- `Match to job`, `Education`, and `Work experience` populate after successful parsing.
- Retry parsing works from the admin detail/API route.

Required diagnostic path:

1. Submit test applications with PDF, DOC, and DOCX resumes.
2. Inspect created applicants for `resumeUrl`, `parsingStatus`, `parsedData`, `score`, and `data`.
3. Verify the uploaded file URL opens from the server and admin resume viewer.
4. Confirm `enqueueResumeParseJob` runs and creates the expected pg-boss job.
5. Run `pnpm worker:resume` and confirm applicant rows update.
6. Check errors from `extractText`, OpenRouter parsing, match scoring, GCS/local storage, and email separately.
7. Add tests for upload success/failure, enqueue failure, worker parse success/failure, and admin retry.

## Reusable Context

Git safe-directory command:

```bash
git -c safe.directory="C:/Users/a2021/OneDrive/Escritorio/Vibe projects workspace/PROYECTOS/ScoutLane" <command>
```

Common verification commands:

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm test:e2e
pnpm worker:resume
```

Local environment notes:

- Current untracked local-only path observed on 2026-05-20: `playwright-report/`.
- In sandboxed runs, `pnpm` commands can hit Windows `EPERM` reading `node_modules/.pnpm`; rerun with approved permissions if needed.
- Git may warn about `C:\Users\a2021/.config/git/ignore` permission. The warning is known and not caused by project files.
- A second Next dev server on `3007` previously reported that another server was already running for this directory.
- Worker deployment must run outside Vercel serverless; use a persistent Node runtime for `pnpm worker:resume`.

## How To Update This Handoff

For each meaningful work session:

1. Add one row to the Session Index.
2. Add or update Open Issues.
3. Keep Current Snapshot accurate.
4. Put detailed notes in `docs/session-reports/YYYY-MM-DD-short-topic.md`.
5. Do not bury active blockers only inside old session reports.
