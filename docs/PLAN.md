# ScoutLane — Take-Home Completion Plan (Full Polish)

## Context

ScoutLane is the user's submission for the **Genious Full-Stack Developer Take-Home** — a recruitment pipeline platform with resume intelligence and a job-scoped analytics dashboard (spec at `…/Genious/Copy of Full-Stack Developer Take-Home Assessments.md`). The user wants 100% spec coverage including bonus items, with a markdown-tracked backlog and a dual-layer prototype test (Playwright smoke + human UX protocol).

This plan synthesizes a deep audit of the spec (13 sections, ~810 lines) against the current codebase. The result: **strong foundation, ~70% spec coverage today**, with concrete gaps in templates UX, analytics breadth, integration audit UI, async worker discipline, and demo-ready polish.

The plan is structured to **avoid bottlenecks**: tasks are ordered so the user can ship the easiest wins first, build momentum, and never block on a single long-running task. Each large feature is decomposed into 30–90 minute subtasks. The full backlog lives in `docs/BACKLOG.md` once executed.

---

## Current State Snapshot (audited)

### Working today
- **Auth**: NextAuth v5 (JWT), Google OAuth + dev Credentials, INITIAL_ADMIN_EMAIL bootstrap (`src/lib/auth/auth.ts:6,18-33`), strict middleware (`src/middleware.ts`)
- **Database**: 11 models (User, Org, Job, Applicant, PipelineStage, StageTransition, JobTemplate, JobIntegration, Webhook, IntegrationLog, WebhookLog), 5 migrations, seed with 30 applicants
- **Public**: `/`, `/careers/[slug]` with application form, `/signin`, `/access-denied`
- **Admin pages**: `/admin` (metrics + 2 charts), `/admin/jobs`, `/admin/jobs/new`, `/admin/jobs/[id]`, `/admin/jobs/[id]/edit`, `/admin/jobs/[id]/applicants`, `/admin/jobs/[id]/applicants/[applicantId]`, `/admin/jobs/[id]/pipeline` (DnD Kanban), `/admin/jobs/[id]/stages`, `/admin/jobs/[id]/integrations`, `/admin/templates`, `/admin/templates/[id]`, `/admin/settings`
- **API**: `/api/health`, `/api/auth/[...nextauth]`, `/api/public/jobs/[slug]/applications`, `/api/admin/jobs/[id]/pipeline`, `/api/admin/jobs/[id]/integrations`, `/api/admin/jobs/integrations/[integrationId]`, `/api/admin/jobs/parse-retry/[applicantId]`
- **Infra wired**: Resend email (`src/lib/email/send.ts`), GCS storage (`src/lib/storage/upload.ts`), Gemini LLM parsing (`src/lib/llm/resume.ts`), Recharts, @dnd-kit, react-hook-form + Zod
- **Services**: jobs (CRUD), applicants (read/update), pipeline (read/update/stages CRUD), templates (CRUD), applications (submit + bg parse)

### Critical bugs / inconsistencies
1. **Pipeline stage → status mapping silently fails** (`src/app/api/admin/jobs/[id]/pipeline/route.ts`): only `NEW` and `INTERVIEW` match seed stage names; other columns are empty
2. **Folder name typo**: `[applicantId]_components/` should be `[applicantId]/_components/`
3. **Fire-and-forget bg work**: resume parse + webhook dispatch are unmanaged promises (no retry, no idempotency)
4. **`.env.example`**: lists unused vars (OPENAI_API_KEY, INNGEST_*, NEXT_PUBLIC_APP_URL); installed-but-unused deps (`@supabase/supabase-js`, `openai`)

### Spec-required pieces MISSING
- Submission confirmation page; integration audit log UI; manual integration retry button; "test integration" sample-payload action; CSV export; signed-URL resume access; template duplicate; template preview; template question-snapshot onto job; institution + degree + date-range volume charts; skills/date-range filter, group-by-degree; manual parsed-data edit; low-confidence indicator; time-in-stage compact format in Kanban; stage color UI; `noindex` meta on careers pages; pg-boss workers; idempotent webhook; keyboard shortcuts; tests (zero exist); API docs page; richer seed data

---

## Backlog (decomposed easy → medium → hard)

Full list lives at `docs/BACKLOG.md` after Phase 0 below. Each item is a checkbox; sub-bullets are 30–90 min subtasks.

### EASY — Sprint 1: Foundation polish (1–2 days, no architectural risk)

- **E1. Fix folder typo** (`[applicantId]_components/` → `[applicantId]/_components/`)
  - Rename folder, update any relative imports, run typecheck
- **E2. Add `noindex/nofollow/noarchive` meta on `/careers/[slug]`** (spec §"Individual Job Listings")
  - Add `metadata.robots` in page.tsx; add `app/robots.ts` excluding `/careers/*`
- **E3. Pipeline stage→status mapping fix** (BLOCKER for pipeline UX)
  - Stop bridging via enum uppercase; query Applicant by `pipelineStageId` FK; add migration to add `pipelineStageId` on Applicant if missing, or use existing relation
  - Backfill seed applicants to specific stages
- **E4. README accuracy fixes** ("database sessions" → JWT, "S3" → GCS)
- **E5. Seed default stages aligned to spec**: Applied, Screening, Assessment, Interview, Offer, Hired, Rejected
- **E6. Remove dead deps** (`@supabase/supabase-js`, `openai`); clean unused env vars from `.env.example`
- **E7. Page titles + favicon** across admin (metadata.title per route)
- **E8. Loading skeletons** (`loading.tsx`) for admin pages
- **E9. `error.tsx` + `not-found.tsx`** for admin pages
- **E10. Status badge color tokens** (single source of truth `src/lib/status-colors.ts`)
- **E11. Toast notification hookup** (sonner) for: job published, stage moved, integration saved/deleted, parse retry triggered
- **E12. Status banner for closed jobs on `/careers/[slug]`** (already partial — verify wording matches spec exactly)
- **E13. Compact relative time utility** (`src/lib/time/compact.ts` → `1h, 3d, 2w, 2mo, 1yr`)

### EASY — Sprint 2: Quick wins (1–2 days)

- **E14. Submission confirmation page** `/careers/[slug]/applied`
  - New route, reads name+job from query string; clean confirmation UI; "apply to another role" link
  - Update form `action` redirect target
- **E15. Time-in-stage in Kanban cards** (uses E13 utility)
- **E16. Empty state polish** across applicant list, pipeline, integrations, templates (icon + CTA)
- **E17. Job switcher dropdown** in admin nav (header component)
- **E18. "Copy public URL" button** on job detail page
- **E19. Keyboard shortcut "?" overlay** (bonus — show shortcuts like `g j` → jobs, `c` → new job)
- **E20. Mobile responsiveness audit pass** (admin pages — table → cards on narrow viewport)

### MEDIUM — Sprint 3: Demo-critical features (3–5 days)

- **M1. Template duplication**
  - Add `duplicateTemplate(id)` service in `src/server/services/templates.ts`
  - Add "Duplicate" button on `/admin/templates` list and detail
  - Names new template `"<original> (copy)"`
- **M2. Template preview**
  - New route `/admin/templates/[id]/preview`
  - Renders form fields as applicant would see + question list with durations
- **M3. Template question-snapshot onto Job**
  - Migration: add `assessmentQuestions JSON` column on Job
  - In job create-with-template: snapshot `template.questions` into job
  - Integration payload reads from job (not template) so post-apply edits don't desync
- **M4. CSV export of applicant list**
  - Server action accepting current filter state → returns CSV
  - "Export CSV" button on `/admin/jobs/[id]/applicants`
- **M5. Integration audit log UI**
  - New page `/admin/jobs/[id]/integrations/logs` (or tab on integrations page)
  - Table: stage, timestamp, status, response code, retry button, payload preview drawer
  - Reads from existing `IntegrationLog` model
- **M6. Manual retry of failed integration**
  - Endpoint `POST /api/admin/integrations/logs/[logId]/retry`
  - Service `retryIntegrationCall(logId)` — re-sends original payload
  - Wire retry button from M5
- **M7. "Test integration" button** on integration config
  - Sends synthetic payload with fake applicant data to configured URL
  - Shows result inline (status code + response body)
- **M8. Institution distribution chart** on job dashboard (bar chart, top N)
- **M9. Degree/field-of-study distribution chart** on job dashboard
- **M10. Application volume chart with date-range selector** (replace static trend)
  - DateRange picker component (shadcn calendar)
  - Server query buckets by day/week
- **M11. Richer seed data** (30+ applicants across 4–5 jobs with varied institutions, degrees, skills, statuses)

### MEDIUM — Sprint 4: Power-user features (3–5 days)

- **M12. Skills multi-select filter** (chips from union of all parsed skills in pool)
- **M13. Date-range filter** on applicant list (date applied)
- **M14. Group-by-degree** in applicant list (extend existing group-by)
- **M15. Manual edit of parsed resume fields**
  - Edit modal on applicant detail page
  - Form mirrors parsed JSON structure (education[], workHistory[], skills[])
  - Validates and persists to `parsedData` column
- **M16. Low-confidence indicator** on parsed fields
  - LLM prompt update to return per-field confidence (or `null`/`unknown`)
  - UI: faded text + warning icon for low-confidence fields
- **M17. Multiple education + work entries polish** in applicant detail (display all, not just first)
- **M18. Form builder UI for custom fields** (full drag-drop)
  - Read/write to existing `Job.customFields` JSON column
  - Field types: text, textarea, number, dropdown (with options), file (PDF), checkbox
  - Drag-reorder, edit-in-place, delete confirmation
  - Apply to applicant form rendering on `/careers/[slug]`
- **M19. Job dashboard tabs nav** (Overview / Applicants / Pipeline / Stages / Integrations / Settings)
- **M20. Stage color customization UI** in pipeline config
- **M21. Per-applicant activity timeline polish** (aggregate StageTransition + parse events + integration calls + note adds)
- **M22. Application form validation polish** (inline errors, ARIA, immediate feedback)
- **M23. Signed URLs for GCS resume access** (`getSignedReadUrl(bucket, key, 15min)` in storage lib)

### HARD — Sprint 5: Architectural upgrades (3–5 days)

- **H1. pg-boss worker for resume parsing**
  - Create `src/server/workers/parse-resume.ts`
  - Boot pg-boss queue at startup; enqueue from `submitJobApplication` instead of fire-and-forget
  - Worker handles retries (3x exp backoff) + updates `parsingStatus`
- **H2. pg-boss worker for webhook dispatch**
  - Create `src/server/workers/dispatch-webhook.ts`
  - Replace fire-and-forget in `moveApplicant`
  - Persists request payload in IntegrationLog before send (for retry)
  - Retries on 5xx, never on 4xx
- **H3. Idempotent stage transition / webhook**
  - Add `transitionKey` (hash of applicantId+toStageId+timestamp-bucket) unique constraint on IntegrationLog
  - Dedups same-trigger double-fire (spec §"guard against accidental duplicate sends")
- **H4. Vitest unit tests** for critical services (jobs/create slug, pipeline/stages/reorder, applications/submit dedup, templates/snapshot)
- **H5. Playwright E2E smoke test** (see Prototype Test section below)
- **H6. API documentation page** `/admin/api-docs` or `docs/API.md`
  - Document every public + admin endpoint, request/response shape, auth
- **H7. Performance indexes** for applicant filter/sort (Prisma migration adding indexes on `jobId,createdAt`, GIN on `parsedData` for skills)

### HARD — Optional / bonus (cut if time-boxing)

- **H8. RBAC: enable RECRUITER read-only access** (currently blocked at middleware)
- **H9. Admin invite system** (email link → accept → role assignment)
- **H10. Rate limiting** on `/api/public/*` (per-IP via Upstash Redis or simple in-memory dev fallback)

---

## Non-Bottleneck Execution Order

Tackle in this order. Each sprint produces a shippable increment, demoed end-to-end at sprint end.

```
Sprint 1 (Foundation polish)  →  E1, E3, E4, E5, E6, E7, E8, E9, E10, E11, E12, E13
Sprint 2 (Quick wins)         →  E14, E15, E16, E17, E18, E19, E20, M11
Sprint 3 (Demo-critical)      →  M1, M2, M3, M5, M6, M7, M8, M9, M10
Sprint 4 (Power-user)         →  M4, M12, M13, M14, M15, M16, M17, M18, M19, M20, M21, M22, M23
Sprint 5 (Architecture)       →  H1, H2, H3, H4, H5, H6, H7
Sprint 6 (Bonus / cleanup)    →  H8, H9, H10 (only if time)
```

**Rationale:** Sprint 1 fixes silent bugs (E3 — pipeline mapping) and removes friction (E4–E11). Sprint 2 closes the smallest spec gaps for shippable demo footage. Sprint 3 unlocks the *Recorded Demo* deliverable (templates → integration → analytics). Sprint 4 deepens dashboard quality (the spec's primary scoring axis). Sprint 5 productionizes async work and adds tests so the user can confidently extend the system.

Each subtask should land as its own commit on its own short-lived branch (`feat/<slug>`), with pre-commit `pnpm typecheck && pnpm lint` green. No merges of half-done work.

---

## Prototype Test Setup

### Phase A — Automated Playwright smoke (run before each human session)

**Location**: `tests/e2e/smoke.spec.ts`

**Critical flows covered**:
1. Public submit → confirmation page → admin sees applicant with `Parsing...` status
2. Admin moves applicant through pipeline stages → activity timeline updates
3. Admin configures integration with webhook.site URL → moves applicant → integration log shows success
4. Admin creates template → applies to new job → form + questions populated
5. Admin filters/sorts applicant list → result count and order correct
6. CSV export downloads non-empty file with correct headers

**Tooling**:
- Use `@playwright/test` (install in Sprint 5)
- Screenshot each step → `tests/e2e/screenshots/<flow>/<step>.png`
- Run via `pnpm test:e2e`
- CI workflow: add to `.github/workflows/ci.yml`

### Phase B — Human UX protocol (docs/UX-TEST-PROTOCOL.md)

**Structure**:
- 30-minute moderated session, 3–5 testers (recruiter persona + non-technical hiring manager persona)
- 6 timed tasks taken from the spec's *Recorded Demo* checklist
- Think-aloud instructions
- Embedded Google Form / Tally for quantitative scoring (5-point Likert per task) + free-text feedback

**Sample task script** (drafted in Sprint 6):
1. Create a template for "Software Engineer" with custom fields + 4 questions (target: under 3 min)
2. Apply that template to a new job; publish it
3. Open the public URL and submit your own application
4. Find your application in the admin dashboard; move it from "Applied" to "Interview"
5. Configure an integration on the Interview stage pointing to webhook.site; verify firing
6. Export the applicant list as CSV; confirm content

**Output**: `docs/UX-FEEDBACK/<date>-session-<n>.md` per session, summary report after all sessions.

---

## Critical Files to Touch (high-traffic ones to know about)

- `src/app/api/admin/jobs/[id]/pipeline/route.ts` — E3 (mapping fix), M5/M6 (logs)
- `src/server/services/applications.ts:124-126` — H1 (replace fire-and-forget)
- `src/server/services/pipeline/update.ts` — H2 (replace fire-and-forget), H3 (idempotency)
- `src/server/services/templates.ts` — M1 (duplicate), M3 (snapshot)
- `src/components/pipeline/KanbanBoard.tsx` & `ApplicantCard.tsx` — E15 (time-in-stage), M20 (stage color)
- `src/components/dashboard/Charts.tsx` — M8/9/10 (new charts)
- `src/app/(public)/careers/[slug]/page.tsx` — E2 (noindex), E12 (closed-job banner verification)
- `src/components/public/ApplicationForm.tsx` — E14 (redirect target), M22 (validation polish)
- `src/app/(admin)/admin/jobs/[id]/applicants/page.tsx` — M4/M12/M13/M14 (export, filters)
- `src/app/(admin)/admin/jobs/[id]/applicants/[applicantId]/page.tsx` — M15/M16/M17 (parsed data edit, confidence, multi-entry)
- `prisma/schema.prisma` — M3 (Job.assessmentQuestions), H3 (IntegrationLog.transitionKey), H7 (indexes)
- `prisma/seed.ts` — E5 (default stages), M11 (richer data)
- `src/middleware.ts` — H8 (RBAC if enabled)
- `src/lib/storage/upload.ts` — M23 (signed URL helper)
- `src/server/workers/parse-resume.ts` (NEW) — H1
- `src/server/workers/dispatch-webhook.ts` (NEW) — H2

## Reusable utilities to leverage (don't rewrite)

- `src/lib/jobs/status.ts` — `getJobStatus()`, `getJobPersistence()` — derived status logic
- `src/lib/auth/auth.ts` — `requireSession`, `getCurrentUserWithOrganization`
- `src/schemas/*` — existing Zod schemas (extend, don't duplicate)
- `src/components/ui/*` — shadcn primitives (button, form, input, label, table, textarea); add more via shadcn CLI as needed
- `src/lib/email/send.ts:18` — `sendApplicationConfirmationEmail()` pattern for new email types
- `src/lib/llm/resume.ts` — Gemini parsing structure; extend prompt for confidence (M16)

---

## Deliverables (this plan produces)

1. **`docs/BACKLOG.md`** — full checklist mirror of this backlog (Easy/Medium/Hard sections, checkboxes)
2. **`docs/UX-TEST-PROTOCOL.md`** — human session script + feedback form template
3. **`tests/e2e/smoke.spec.ts`** — Playwright smoke (created in Sprint 5/H5)
4. **`tests/e2e/screenshots/`** — visual diff baseline
5. **All sprint commits on `main`** with conventional commit messages
6. **Updated `README.md`** with accurate architecture + Codespaces instructions + deploy URL
7. **`docs/API.md`** — endpoint reference (Sprint 5/H6)

---

## Verification (end-to-end)

After each sprint, run:

```bash
pnpm lint && pnpm typecheck && pnpm test -- --run
pnpm build
pnpm dev   # manual smoke
```

After Sprint 5:

```bash
pnpm test:e2e   # Playwright smoke (all flows pass)
```

Manual sanity (each sprint):
- Submit a real application from `/careers/<slug>` → confirmation page → confirmation email lands → admin sees applicant
- Move applicant through pipeline → activity timeline shows transition with admin user + timestamp
- Configure integration pointing at webhook.site → trigger fires → response logged
- Apply template to new job → form fields + assessment questions populate correctly
- Export CSV → open in Excel → all expected columns present

Spec-level verification (final pass before submission):
- Walk through *every* item in spec §"Recorded Demo" deliverable — every flow must work without dead-ends
- Walk through *every* item in spec §"QA Expectations" — drag-drop with 20+ applicants, varied resume formats, concurrent edits, etc.
- Confirm public URLs are `noindex`-flagged (`curl -I /careers/<slug>` → check `x-robots-tag`)
- Confirm deployed URL is in README and live

---

## Phase 0 — Immediately on plan approval

Before Sprint 1 starts:
1. Create `docs/BACKLOG.md` mirroring this backlog (checkboxes per task)
2. Run `git pull origin main` (per CLAUDE.md pre-build pull rule)
3. Create branch `chore/backlog-and-test-protocol`
4. Commit BACKLOG.md + UX-TEST-PROTOCOL.md skeleton
5. Open PR (or merge directly to main per project conventions)

Then Sprint 1 begins with E1.
