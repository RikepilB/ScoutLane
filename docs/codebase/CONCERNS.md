# Codebase Concerns

**Analysis Date:** 2026-05-13

## Security Concerns

**Dev Credentials Provider Always Enabled in Dev:**
- Issue: `src/lib/auth/auth.config.ts` registers a Credentials provider when `NODE_ENV === "development"` OR `!process.env.AUTH_GOOGLE_ID`. This provider grants `role: "ADMIN"` to ANY email address with no password. This is intended for local dev but the fallback condition (`!process.env.AUTH_GOOGLE_ID`) may unintentionally activate dev auth in staging/prod if Google auth is misconfigured.
- Files: `src/lib/auth/auth.config.ts` (lines 10-34)
- Risk: If AUTH_GOOGLE_ID is not set in staging/production, the entire admin panel becomes accessible with any email address
- Recommendation: Change condition to `process.env.NODE_ENV === "development"` only — remove the `!process.env.AUTH_GOOGLE_ID` fallback. Add startup validation to require AUTH_GOOGLE_ID in production.

**GCS Credentials Validation at Runtime:**
- Issue: `src/lib/storage/client.ts` validates GCS credentials with Zod schemas but only when functions are called. If credentials are missing/invalid, the error surfaces during file upload, not at startup. Logs are not shown (`"log: ["error"]"` in `src/lib/db/prisma.ts` suppresses most context).
- Files: `src/lib/storage/client.ts` (lines 23-31, 42-49)
- Risk: Uploads silently fail with vague errors. Users may not know why applications aren't being saved.
- Recommendation: Run credential validation on server startup in `next.config.ts` or a health check endpoint. Fail loudly if GCS is unconfigured when storage is expected.

**Missing Input Validation in Public Application Endpoint:**
- Issue: `src/app/api/public/jobs/[slug]/applications/route.ts` validates firstName/lastName/email/phone but does NOT validate the `resumeFile` type or size before attempting to upload. The form client sends resumeFile in FormData, but server-side size/type checks are absent.
- Files: `src/app/api/public/jobs/[slug]/applications/route.ts` (lines 8-29), `src/components/public/ApplicationForm.tsx` (line 64)
- Risk: Users could upload arbitrary files or very large files, consuming storage quota and potentially causing DoS
- Recommendation: Add Zod validation for file type (PDF/DOCX only) and max size (e.g., 10MB) before `uploadFileBuffer()` call. Reject with 400 if file exceeds limits.

**JSON.parse Without Error Handling:**
- Issue: `src/server/services/applications.ts` (lines 61-64) parses customFields JSON from FormData with `JSON.parse(raw)` inside a try-catch, but if the JSON is malformed, the error is caught and customFields silently become an empty object.
- Files: `src/server/services/applications.ts` (lines 61-67)
- Risk: Malformed custom field data is silently dropped; users don't know their form answers weren't captured
- Recommendation: Log the parse error to server logs and return it in the API response as a warning (existing `warning` field on the response is already there for this purpose).

**Missing Rate Limiting:**
- Issue: `/api/public/jobs/[slug]/applications/route.ts` has no rate limiting. A malicious actor can spam job applications indefinitely.
- Files: `src/app/api/public/jobs/[slug]/applications/route.ts`
- Risk: DoS attack via application spam; database filled with test records; email quota exhausted
- Recommendation: Add rate limiting middleware (e.g., using `Ratelimit` from `@vercel/ratelimit` or similar) keyed by IP + email. Limit to 5 applications per email per hour.

## Authentication & Authorization Issues

**Auth Strictness: RECRUITER and HIRING_MANAGER Roles Blocked from /admin:**
- Issue: `src/middleware.ts` (line 30) redirects any non-ADMIN role from `/admin/*` to `/access-denied`. UserRole enum includes `RECRUITER` and `HIRING_MANAGER`, but middleware blocks them entirely despite being valid roles.
- Files: `src/middleware.ts` (lines 30-33)
- Impact: RECRUITER and HIRING_MANAGER users cannot access any admin feature, even read-only dashboards. These roles are defined but unusable.
- Fix approach: Either (a) remove RECRUITER/HIRING_MANAGER from UserRole enum if they're not supported, or (b) update middleware to allow them with role-based feature gates (e.g., they can view but not edit jobs).

**JWT Session Strategy vs Documentation:**
- Issue: `src/lib/auth/auth.config.ts` (line 40) uses `strategy: "jwt"` but README.md and AGENTS.md state "database sessions". The Prisma `Session` model (`prisma/schema.prisma` lines 83-89) exists but is never queried (`prisma.session.*` never appears in codebase).
- Files: `src/lib/auth/auth.config.ts` (line 40), `prisma/schema.prisma` (lines 83-89)
- Impact: Documentation misleads developers about session persistence. The Session table is dead weight in the database.
- Fix approach: Update README.md and AGENTS.md to reflect JWT strategy. Remove the Session model from Prisma schema in a migration, or document that it's reserved for future use.

## Architectural & Design Issues

**Pipeline Status Coupling — Silent Failures:**
- Issue: `src/app/api/admin/jobs/[id]/pipeline/route.ts` (lines 29-40) assumes pipeline stage names match ApplicationStatus enum values when uppercased. Seed data creates stages named `New / Screening / Interview / Offer / Hired`, but only `NEW` and `INTERVIEW` match the enum. Stages `SCREENING`, `OFFER`, and `HIRED` produce empty columns with no error.
- Files: `src/app/api/admin/jobs/[id]/pipeline/route.ts` (lines 29-40), `prisma/seed.ts` (if examined separately)
- Impact: Applicants in `REVIEWING`, `SHORTLISTED`, `OFFERED`, `REJECTED`, `WITHDRAWN` statuses disappear from the pipeline view. Recruiters lose visibility of candidates.
- Fix approach: (a) Validate stage names against ApplicationStatus enum at job creation; reject invalid stage names with clear error. (b) Or, change the grouping logic to use a mapping table (StageMapping: stageName → ApplicationStatus) instead of string matching.

**Form Builder UI Without Persistence Discipline:**
- Issue: `src/app/(admin)/admin/jobs/[id]/form/page.tsx` allows editing custom fields but doesn't show validation errors, loading states for individual saves, or feedback if the save fails. The form silently drops errors (line 34: `.catch(() => {})`).
- Files: `src/app/(admin)/admin/jobs/[id]/form/page.tsx` (lines 29-34, 54-61)
- Impact: Admins think fields are saved when they're not. No audit trail of field changes.
- Fix approach: (a) Show error toast/modal if fetch fails. (b) Add optimistic UI — disable Save button and show "Saving..." during request. (c) On error, revert to previous state and show what went wrong.

**Double Nesting in URL Structure:**
- Issue: `src/app/(admin)/admin/jobs/[id]/applicants/[applicantId]_components/` folder name is incorrect. The `_components` suffix should be on the folder inside `[applicantId]`, not on the segment itself. Current path: `/admin/jobs/[id]/applicants/[applicantId]_components/` should be `/admin/jobs/[id]/applicants/[applicantId]/_components/`.
- Files: `src/app/(admin)/admin/jobs/[id]/applicants/` directory structure
- Impact: Cosmetic; private folder naming convention is unclear to future developers
- Fix approach: Rename directory from `[applicantId]_components` to `[applicantId]`, create `_components/` folder inside it. Update any imports.

## Missing Implementation & Scaffolding

**Admin REST Endpoints Scaffolded But Mostly Unimplemented:**
- Issue: README.md lists many admin API endpoints (`POST /api/admin/jobs`, `PUT /api/admin/jobs/[id]`, `POST /api/admin/jobs/[id]/applicants/[applicantId]`, etc.), but only 4 route files exist:
  - `src/app/api/admin/jobs/[id]/form/route.ts` (GET only)
  - `src/app/api/admin/jobs/[id]/pipeline/route.ts` (GET only)
  - `src/app/api/admin/jobs/[id]/integrations/route.ts` (POST only)
  - `src/app/api/admin/jobs/integrations/[integrationId]/route.ts` (GET/DELETE only)
- Files: Missing most of `src/app/api/admin/jobs/route.ts`, `src/app/api/admin/jobs/[id]/route.ts`, etc.
- Impact: Admin pages call services directly (RSC) instead of via fetch. This works for now but breaks mobile/external client access. API feels incomplete if someone tries to use it programmatically.
- Fix approach: Either (a) implement the missing endpoints, or (b) update README.md to document that the admin API is incomplete and internal pages use RSC queries directly.

**Background Workers Completely Stubbed:**
- Issue: `src/server/workers/` directory does not exist (find returns error). README.md and AGENTS.md describe pg-boss workers for resume parsing, email notifications, and webhook dispatch, but there's no implementation.
- Files: Missing `src/server/workers/` directory entirely
- Impact: Resume parsing, email workflows, and integrations cannot run asynchronously. If implemented later, a large amount of code will need refactoring.
- Fix approach: Create `src/server/workers/` directory structure with placeholders, add pg-boss setup to `src/lib/workers/client.ts`, and document in CLAUDE.md that workers are "reserved for future use" (currently greenfield).

**Test Coverage: Zero Test Files in src/**
- Issue: CLAUDE.md confirms "There are currently no `*.test.{ts,tsx}` files in `src/`; Vitest is wired up but unused."
- Files: No tests found in `src/` directory
- Impact: Critical business logic (`src/server/services/`, `src/lib/jobs/status.ts`, auth config) has zero test coverage. Refactoring is risky.
- Risk: HIGH — high confidence that changes will break existing flows
- Fix approach: Start with unit tests for pure functions (`src/lib/jobs/status.ts`, `src/lib/slug.ts`), then move to services. Use tdd-guide agent for new features; add test-writer agent for coverage of existing code.

## Data & Query Concerns

**Applicant Status Derived but Not Validated:**
- Issue: Applicants have a `status` field (enum ApplicationStatus) that is derived from pipeline stages, but there's no validation preventing manual status updates that don't correspond to a stage. If an applicant is moved to `OFFERED` but no "Offer" stage exists, the applicant becomes invisible in the pipeline.
- Files: `src/app/api/admin/jobs/[id]/pipeline/route.ts` (implicit assumption), `prisma/schema.prisma` (lines 152)
- Impact: Data inconsistency; applicants can get "stuck" in statuses with no visible stage
- Fix approach: Add a trigger or application-level validation: before setting applicant.status, ensure a stage with matching name exists. Or, store stageId directly instead of deriving from stage name.

**Console.error in Production Code:**
- Issue: `src/app/api/public/jobs/[slug]/applications/route.ts` (line 92) uses `console.error()` for error logging. In production, this logs to stdout/stderr, which may or may not be captured by the deployment platform's logging system.
- Files: `src/app/api/public/jobs/[slug]/applications/route.ts` (line 92)
- Risk: Errors logged to console are hard to query/monitor; no structured logging for alerting
- Recommendation: Replace with a proper logging service (e.g., Resend error tracking, Sentry, or structured JSON logging to stdout). At minimum, include request context (slug, email) in the error.

**Custom Fields JSON Without Schema:**
- Issue: `Job.customFields` is stored as `Json?` (Prisma generic JSON type) and `Applicant.data` is also `Json?`. There's no schema validation or versioning. If the structure changes, old records become unparseable.
- Files: `prisma/schema.prisma` (lines 116, 155), `src/server/services/applications.ts` (lines 61-67)
- Impact: Custom field migrations are manual/error-prone. Applicant answers might be lost or misinterpreted if schema changes.
- Fix approach: Define a Zod schema for CustomField[] and ApplicationData, enforce it on write. Version the schema in a `_version` field if migration is needed later.

## Documentation Drift

**README.md Overstates Feature Completion:**
- Issue: README.md lists admin endpoints and database sessions as implemented, but CLAUDE.md clarifies they're "scaffolded but not implemented" (JWT sessions only) and workers are "greenfield".
- Files: `README.md` vs `CLAUDE.md`
- Impact: New developers assume features are complete and waste time debugging "why it doesn't work"
- Fix approach: Update README.md to use "Planned" sections and clarify actual vs intended state. Or, remove admin API docs and link to CLAUDE.md instead.

**AGENTS.md Not Committed:**
- Issue: AGENTS.md is gitignored, so recommendations in it are not shared with future developers. If AGENTS.md diverges from code, there's no way to know.
- Files: `.gitignore` (implicit), `AGENTS.md` (local only)
- Impact: Agent guidance is invisible; developers can't learn from it
- Fix approach: Either commit AGENTS.md with `git rm --cached` → remove from .gitignore, or move its content into CLAUDE.md or README.md.

## Package Management & Config

**Stale package-lock.json:**
- Issue: Both `package-lock.json` (437KB, modified 2026-05-07) and `pnpm-lock.yaml` (290KB, modified 2026-05-13) exist. CLAUDE.md states pnpm is canonical; npm must not be used.
- Files: `package-lock.json` (stale), `pnpm-lock.yaml` (current)
- Risk: If someone runs `npm install` instead of `pnpm install`, they'll lock to the old npm packages. This could introduce subtle version mismatches.
- Fix approach: Delete `package-lock.json` with `git rm package-lock.json` and add it to `.gitignore`. Add a pre-commit hook to fail if `package-lock.json` is created.

## Module Boundary Violations & Cross-Service Coupling

**_lib/validate-session is a Shared Utility:**
- Issue: Multiple services import `src/server/services/_lib/validate-session.ts`. While this is acceptable for shared infrastructure, it means any change to session validation affects all services. There's no isolation between modules.
- Files: `src/server/services/_lib/validate-session.ts` imported by `applicants/read.ts`, `jobs/delete.ts`, `jobs/update.ts`, `pipeline/read.ts`, `pipeline/update.ts`
- Impact: Low risk now, but if session handling becomes role-specific (e.g., recruiters have different capabilities than admins), all services need updates simultaneously
- Fix approach: OK to keep as-is for now; document that it's a shared service in `src/server/services/_lib/README.md`.

## Untested Code Paths

**Form Builder Error Recovery Not Tested:**
- Issue: `src/app/(admin)/admin/jobs/[id]/form/page.tsx` silently catches errors during fetch (line 34), making it impossible to test error scenarios without network manipulation.
- Files: `src/app/(admin)/admin/jobs/[id]/form/page.tsx` (lines 29-34)
- Impact: Error handling is untested; bugs in recovery path go unnoticed
- Fix approach: Extract fetch into a service function, test it in isolation with mock/error scenarios.

**Pipeline Grouping Logic Not Tested:**
- Issue: `src/app/api/admin/jobs/[id]/pipeline/route.ts` (lines 29-40) has complex logic to group applicants by stage. Without tests, changes risk silent failures (applicants disappearing from view).
- Files: `src/app/api/admin/jobs/[id]/pipeline/route.ts`
- Impact: MEDIUM — visual glitches rather than data loss, but recruiter workflow breaks
- Fix approach: Write integration test that (a) creates job with stages, (b) adds applicants with various statuses, (c) calls GET /api/admin/jobs/[id]/pipeline, (d) asserts correct grouping.

## Summary by Priority

**CRITICAL (security, data loss):**
- Dev Credentials always enabled if AUTH_GOOGLE_ID missing
- Missing file upload validation (type/size)
- Missing rate limiting on public endpoints
- Auth strictness blocks valid roles

**HIGH (feature completeness, usability):**
- Pipeline/status coupling silent failures
- Form builder error handling broken
- Zero test coverage
- Admin API mostly unimplemented

**MEDIUM (maintainability, documentation):**
- JWT session model unused; docs out of sync
- Custom fields JSON without schema validation
- Workers greenfield (blocks integrations)
- Stale package-lock.json
- README overstates completion

**LOW (code quality, cosmetics):**
- Double nesting in directory structure
- Console.error instead of structured logging
- Documentation drift (AGENTS.md not committed)

---

*Concerns audit: 2026-05-13*
