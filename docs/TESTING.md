# Testing Guide

Last reviewed: 2026-05-19.

The repo now has active Vitest coverage and Playwright smoke scaffolding.

## Current Test Files

```text
src/app/(admin)/admin/jobs/[id]/form/page.test.tsx
src/app/api/admin/jobs/[id]/pipeline/route.test.ts
src/app/api/public/jobs/[slug]/applications/route.test.ts
src/lib/auth/auth.config.test.ts
src/lib/jobs/status.test.ts
src/lib/slug/index.test.ts
src/lib/slug/slugify.test.ts
src/schemas/job.test.ts
src/schemas/template.test.ts
src/server/services/jobs/create-impl.test.ts
tests/e2e/smoke.spec.ts
```

## Commands

| Command | Purpose |
|---|---|
| `pnpm test` | Vitest watch mode. |
| `pnpm test -- --run` | One-shot Vitest run for CI. |
| `pnpm test -- path/to/file.test.ts` | Run a single test file. |
| `pnpm test -- -t "pattern"` | Run tests matching a name pattern. |
| `pnpm test:e2e` | Playwright E2E suite. |
| `pnpm test:e2e --headed` | E2E with visible browser. |
| `pnpm exec playwright test --list` | List discovered E2E tests. |

CI gate order should be:

```bash
pnpm lint
pnpm typecheck
pnpm test -- --run
pnpm build
```

Run Playwright against local dev automatically, or set `PLAYWRIGHT_BASE_URL` to hit staging/production.

Security and dependency evidence to collect before a production/demo handoff:

```bash
pnpm audit --prod
```

Recommended external checks before production are Gitleaks for secrets, Semgrep for static appsec checks, and OWASP ZAP baseline against staging.

## Vitest Setup

- Config: `vitest.config.ts`
- Environment: jsdom
- Setup file: `src/test/setup.ts`
- Prisma mock utilities: `src/test/prisma-mock.ts`
- Co-located test convention: `*.test.ts` or `*.test.tsx` beside the implementation.

Prefer testing implementation files such as `create-impl.ts` over Server Action wrapper files that contain `"use server"`.

## What to Test Next

Highest-value gaps:

- Resume parse queue and worker failure/retry behavior.
- `submitJobApplicationImpl` full flow: validation, duplicate email, storage failure, enqueue failure, email failure.
- Custom fields: dropdown options render publicly, required fields are enforced, unsupported custom file fields are rejected or intentionally disabled.
- Pipeline move side effects: status derivation, `StageTransition`, webhooks, per-stage integrations, idempotency.
- Applicant notes, interview date, and resume JSON editing flows.
- Settings role enforcement.
- Public job alert endpoint.
- Auth and organization isolation: admin routes/actions reject unauthenticated users, wrong roles, and cross-organization access.
- Upload abuse cases: missing file, too-large file, wrong MIME/extension, corrupt PDF/DOC/DOCX, and provider upload failure.
- Public endpoint abuse: rate-limit expectations for applications, job alerts, and public status lookup.

## Mocking Guidance

Mock external boundaries:

- Prisma for unit tests.
- GCS upload client.
- Resend email send.
- OpenRouter client.
- pg-boss queue client.
- Next navigation in React component tests.

Do not mock Zod schemas or simple pure utilities; test their real behavior.

## Playwright Scope

`tests/e2e/smoke.spec.ts` should protect the final take-home user journey:

- Public careers browsing.
- Public application submission.
- Admin sign-in.
- Job and applicant visibility.
- Pipeline movement.
- Responsive behavior on desktop and mobile Chromium.

Keep E2E tests sparse and user-flow oriented. Put business logic edge cases in Vitest.

## Final Assessment Acceptance Scenarios

These scenarios should be proven manually or through Playwright before recording the final demo:

| Scenario | Expected Result | Status |
|---|---|---|
| Create job from template, publish, and open public URL | Job is active and reachable at `/careers/[slug]` | Pending |
| Submit application with resume and required custom fields | Applicant is created, duplicate email check works, confirmation is visible | Pending |
| Resume parsing succeeds or can be retried | Parsed data, score, and parsing status are visible to admin | Pending |
| Move applicant between stages | Applicant card moves, status updates, `StageTransition` appears in timeline | Pending |
| Trigger per-stage integration | Integration log records request/response and webhook.site receives payload | Pending |
| Export applicants | CSV downloads with expected columns and scoped job data | Pending |
| Closed job application attempt | Candidate sees no-longer-accepting message and no applicant is created | Pending |
| Production auth smoke | Dev login is not available in production; Google OAuth works | Pending |

## Security Acceptance Scenarios

| Scenario | Expected Result | Status |
|---|---|---|
| Unauthenticated admin route/API access | Redirect or 401/403 without data leakage | Pending |
| Wrong-role organization settings mutation | Mutation is denied | Pending |
| Cross-job or cross-organization applicant access | Request is denied or returns no data | Pending |
| Unsupported or oversized resume upload | Generic validation error; no applicant or orphaned file remains | Pending |
| Public apply repeated rapidly | Rate limit or abuse control blocks excessive submissions | Planned |
| Integration bearer token display/logging | Token is masked and not written to logs | Pending |
| Secret scan | No real secrets in tracked files | Pending |
