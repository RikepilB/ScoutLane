# ScoutLane Handoff

Last updated: 2026-05-20

## Read This First

Use this file as the first stop for any new agent session. It is the fast index for current repo state, open issues, session history, and reusable local context.

Current snapshot:

| Item | Value |
|---|---|
| Branch | `feat/redesign` |
| Latest observed commit | `f56df75 fix: applicant View link 404, resume preview, OpenRouter AI setup` |
| Prior UI commit | `9569964 fix: improve public job application readability` |
| Main next task | Finish end-to-end application submission verification and configure email env |
| Working tree note | Non-doc code changes were already present; do not overwrite them without review |
| Local app note | A Next dev server has recently run on `http://localhost:3006` |
| Primary test email | `ridi.pillaca@gmail.com` |
| Test resume | `C:\Users\a2021\OneDrive\Escritorio\2026\Toronto\RichardPillaca_RESUME.pdf` |
| Job sample source | `C:\Users\a2021\OneDrive\Escritorio\Vibe projects workspace\PROYECTOS\Documentation\Scoutlane\job post sample.md` |

## Open Issues

| Priority | Area | Symptom | Next Diagnostic Step | Source |
|---|---|---|---|---|
| P1 | Resume parsing | PDF extraction now works and browser submit reaches the parser, but OpenRouter returns `404 No endpoints found for deepseek/deepseek-chat-v3.1:free`. | Set `OPENROUTER_MODEL` to an available model, then submit again and confirm applicant `parsingStatus`, `parsedData`, `data.match`, and `score`. | `2026-05-20-parsing-performance-test` |
| P2 | Application submission E2E | Browser submit on `localhost:3009` POSTed successfully and showed application success, but parsing warning remains because of OpenRouter model config. | Re-run after model config fix and email env config. | `2026-05-20-parsing-performance-test` |
| P2 | Email confirmation | App submit logs `RESEND_API_KEY is not configured`; application can submit but confirmation email cannot send locally. | Configure `RESEND_API_KEY` and `EMAIL_FROM`, then rerun application submit. | `2026-05-20-parsing-performance-test` |
| P2 | Auth/dev login | Dev credentials login can return a session without a persisted `User`, which can break admin DB operations. | Upsert the dev user in `src/lib/auth/auth.ts` sign-in callback; keep Prisma out of `auth.config.ts`. | Review findings |
| P2 | Job creation | New-job form fields `slug`, `department`, `whatYouWillDo`, `requirements`, and `toolsAndSkills` can be dropped during parsing. | Add those fields to the `safeParse` input in `createJobImpl`. | Review findings |
| P2 | Public application form | Required custom application fields are displayed but not enforced. | Validate required custom fields client-side and in `submitJobApplicationImpl`. | Review findings |
| P2 | Public select fields | Custom select fields render only the placeholder and ignore configured options. | Add `options?: string[]` to the public custom field type and render options. | Review findings |
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

- Existing uncommitted non-doc paths observed during this handoff update: `src/lib/storage/upload.ts`, `src/server/services/submit-job-application-impl.ts`, `src/app/api/resumes/`, `src/lib/storage/upload.test.ts`, and `playwright-report/`.
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
