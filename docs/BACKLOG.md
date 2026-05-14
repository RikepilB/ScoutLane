# ScoutLane Backlog

Single source of truth for outstanding work against the Genious take-home spec. Tasks are decomposed into 30–90 minute subtasks and ordered to avoid bottlenecks — finish small wins first, build momentum, ship continuously.

**Legend**: `[ ]` open · `[x]` done · `[~]` in progress · `[!]` blocked

**Conventions**: each task is a separate commit on its own short-lived branch (`feat/<slug>`, `fix/<slug>`). Pre-commit gate is `pnpm typecheck && pnpm lint`. Schema changes get their own commit. Refactors never mix with feature work.

---

## Sprint 1 — Foundation polish

Silent bugs and friction fixes. No architectural risk. Each item is 30–90 min.

- [x] **E1. Fix folder typo** `[applicantId]_components/` → `[applicantId]/_components/`
  - [x] Verified: empty malformed folder was untracked by git; correct path already exists
  - [x] CLAUDE.md "Known cosmetic issue" note removed
- [x] **E2. `noindex/nofollow/noarchive` on `/careers/[slug]`**
  - [x] Added `noarchive`, `nosnippet`, `max-image-preview` to robots metadata
  - [x] Added `X-Robots-Tag` header with `noai, noimageai` LLM scraping defense
  - [x] Created `src/app/robots.ts` excluding `/careers/`, `/admin/`, `/api/` and blocking GPTBot/ClaudeBot/Google-Extended/CCBot/anthropic-ai/PerplexityBot
- [x] **E3. Pipeline stage→status mapping fix (BLOCKER)**
  - [x] Added `Applicant.pipelineStageId` FK with `SET NULL` on delete + indexes
  - [x] Added `Applicant.lastStageChangeAt` for time-in-stage
  - [x] Migration backfill assigns 30 existing applicants to correct stage
  - [x] `moveApplicant(stageId)` replaces `moveApplicant(status)` — pipelineStageId is the source of truth, status enum derived from stage name
  - [x] `getPipelineData` + pipeline route group by `pipelineStageId`
  - [x] `deleteStage` reassigns by FK, defaults to first stage
  - [x] `submitJobApplication` sets initial stage to first by order
  - [x] Kanban: switched cards from `useSortable` to `useDraggable`, columns to `useDroppable` (proper drop targets)
  - [x] Seed assigns explicit `pipelineStageId` per applicant
- [ ] **E4. README accuracy fixes**
  - [ ] `database sessions` → `JWT sessions`
  - [ ] `S3` → `Google Cloud Storage`
  - [ ] List actual implemented API endpoints (drop scaffolded-only)
- [ ] **E5. Seed default stages aligned to spec**
  - [ ] Update `prisma/seed.ts` stage names to `Applied / Screening / Assessment / Interview / Offer / Hired / Rejected`
  - [ ] Drop the seed's `New / Screening / Interview / Offer / Hired` set
  - [ ] Re-run `pnpm prisma:reset`
- [ ] **E6. Dead deps + env cleanup**
  - [ ] `pnpm remove @supabase/supabase-js openai`
  - [ ] Clean `OPENAI_API_KEY`, `INNGEST_*`, `NEXT_PUBLIC_APP_URL` from `.env.example` (or wire `NEXT_PUBLIC_APP_URL`)
  - [ ] `pnpm install` to update lockfile
- [ ] **E7. Page titles + favicon**
  - [ ] Add `metadata.title` per admin route
  - [ ] Add `metadata.icons` once in root layout
- [ ] **E8. Loading skeletons**
  - [ ] `src/app/(admin)/admin/loading.tsx` (shared shell)
  - [ ] Route-specific skeletons for jobs list, applicant list, pipeline
- [ ] **E9. `error.tsx` + `not-found.tsx` for admin**
  - [ ] `src/app/(admin)/admin/error.tsx`
  - [ ] `src/app/(admin)/admin/not-found.tsx`
  - [ ] `src/app/(public)/careers/[slug]/not-found.tsx`
- [ ] **E10. Status badge color tokens**
  - [ ] Create `src/lib/status-colors.ts` with single mapping (job status + applicant status)
  - [ ] Replace inline color logic in `StatusBadge.tsx` and `ApplicantStatusBadge.tsx`
- [ ] **E11. Sonner toast hookup**
  - [ ] Job published → toast
  - [ ] Stage moved → toast (currently silent)
  - [ ] Integration saved/deleted → toast
  - [ ] Parse retry triggered → toast
- [ ] **E12. Closed-job banner wording**
  - [ ] Confirm `/careers/[slug]` shows exact spec message when status is `Closed`
  - [ ] Differentiate `Draft` (not yet public) from `Closed` (was public, no longer accepting)
- [ ] **E13. Compact relative time utility**
  - [ ] Create `src/lib/time/compact.ts` → `1h, 20h, 3d, 2w, 2mo, 1yr` auto-select
  - [ ] Unit test covering all unit boundaries

## Sprint 2 — Quick wins

- [ ] **E14. Submission confirmation page**
  - [ ] New route `src/app/(public)/careers/[slug]/applied/page.tsx`
  - [ ] Read applicant name + job title from search params
  - [ ] "Apply to another role" CTA
  - [ ] Update form action to redirect here
- [ ] **E15. Time-in-stage in Kanban cards** (uses E13)
  - [ ] Display compact relative time on `ApplicantCard.tsx`
  - [ ] Compute from `Applicant.lastStageChangeAt` (add column if missing)
- [ ] **E16. Empty state polish**
  - [ ] Applicant list — icon + "Share the job URL" CTA
  - [ ] Pipeline — illustration + "No applicants yet"
  - [ ] Integrations — "Connect your first webhook" with link to docs
  - [ ] Templates — "Save a role configuration as a template"
- [ ] **E17. Job switcher dropdown** in admin nav header
  - [ ] New component `src/components/admin/JobSwitcher.tsx`
  - [ ] Combobox with search; preserves current sub-route on switch (`/admin/jobs/X/applicants` → `/admin/jobs/Y/applicants`)
- [ ] **E18. "Copy public URL" button** on job detail page (sonner toast on copy)
- [ ] **E19. Keyboard shortcut "?" overlay**
  - [ ] Listener at app root for `?` key
  - [ ] Dialog listing shortcuts: `g j` jobs, `g t` templates, `c` new job, `/` focus search
- [ ] **E20. Mobile responsiveness pass**
  - [ ] Admin pages tested at 375 / 768 / 1280 / 1440 px
  - [ ] Tables → cards below `md` breakpoint where needed
  - [ ] Kanban → vertical stack below `md`

## Sprint 3 — Demo-critical features

- [ ] **M1. Template duplication**
  - [ ] `duplicateTemplate(id)` service in `src/server/services/templates.ts`
  - [ ] Names new template `"<original> (copy)"`
  - [ ] Duplicate button on `/admin/templates` list row + detail page
- [ ] **M2. Template preview**
  - [ ] New route `/admin/templates/[id]/preview`
  - [ ] Renders form fields as applicant would see them + questions with durations
- [ ] **M3. Template question-snapshot onto Job**
  - [ ] Migration: add `assessmentQuestions JSON?` column on `Job`
  - [ ] In job-create-with-template: snapshot `template.questions` → `job.assessmentQuestions`
  - [ ] Integration payload reads from `job.assessmentQuestions` (decouples from later template edits)
  - [ ] Add "edit assessment questions on this job" UI on job settings page
- [ ] **M5. Integration audit log UI**
  - [ ] New page (or tab) `/admin/jobs/[id]/integrations/logs`
  - [ ] Columns: stage, timestamp, status, response code, retry button
  - [ ] Drawer showing payload + response body
- [ ] **M6. Manual retry of failed integration**
  - [ ] `POST /api/admin/integrations/logs/[logId]/retry` endpoint
  - [ ] `retryIntegrationCall(logId)` service
  - [ ] Wire retry button from M5; admin-initiated retries marked `manualRetry: true` in log
- [ ] **M7. "Test integration" button**
  - [ ] Sends synthetic payload with fake applicant to configured URL
  - [ ] Shows result inline (status code + response preview)
- [ ] **M8. Institution distribution chart**
  - [ ] New `InstitutionDistributionChart` in `src/components/dashboard/Charts.tsx`
  - [ ] Server query groups applicants by `parsedData.education[0].institution`
  - [ ] Bar chart, top 10 + "Other"
- [ ] **M9. Degree/field-of-study distribution chart**
  - [ ] Similar to M8, groups by `parsedData.education[0].degree`
- [ ] **M10. Application volume chart with date range**
  - [ ] Replace static trend with DateRange-filterable chart
  - [ ] Add `DateRangePicker` shadcn component
  - [ ] Server query buckets by day/week based on range size
- [ ] **M11. Richer seed data**
  - [ ] 30+ applicants across 4–5 jobs
  - [ ] Varied institutions (10+), degrees, skills (20+ unique)
  - [ ] Mix of `parsingStatus` states (most COMPLETED, a few FAILED for retry demo)

## Sprint 4 — Power-user features

- [ ] **M4. CSV export of applicant list**
  - [ ] Server action accepting current filter state → returns CSV
  - [ ] "Export CSV" button on `/admin/jobs/[id]/applicants`
  - [ ] Filename `applicants-<jobSlug>-<YYYY-MM-DD>.csv`
- [ ] **M12. Skills multi-select filter**
  - [ ] Compute union of all parsed skills in current applicant pool
  - [ ] Combobox chip-multi-select on applicant list page
  - [ ] OR-logic across selected skills (per spec)
- [ ] **M13. Date-range filter on applicant list**
- [ ] **M14. Group-by-degree** in applicant list (extend existing group-by toggle)
- [ ] **M15. Manual edit of parsed resume fields**
  - [ ] Edit modal on applicant detail page
  - [ ] Form mirrors `parsedData` JSON (education[], workHistory[], skills[])
  - [ ] Validates + persists; logs edit in activity timeline
- [ ] **M16. Low-confidence indicator**
  - [ ] Update Gemini prompt to return per-field confidence (`high | medium | low | null`)
  - [ ] UI: faded text + warning icon for `low` confidence; "missing" for `null`
- [ ] **M17. Multiple education + work entries polish**
  - [ ] Applicant detail displays all entries with timeline visualization
  - [ ] Sort by recency
- [ ] **M18. Form builder UI for custom fields** (full drag-drop)
  - [ ] Read/write `Job.customFields` JSON
  - [ ] Field types: text, textarea, number, dropdown, file (PDF), checkbox
  - [ ] Drag-reorder, edit-in-place, delete confirmation
  - [ ] Apply to applicant form on `/careers/[slug]`
- [ ] **M19. Job dashboard tabs nav**
  - [ ] Tabs: Overview / Applicants / Pipeline / Stages / Integrations / Settings
  - [ ] Sticky top of every `/admin/jobs/[id]/*` page
- [ ] **M20. Stage color customization UI** in pipeline config
- [ ] **M21. Activity timeline polish**
  - [ ] Aggregate `StageTransition` + parse events + integration calls + note adds
  - [ ] Server query in `getApplicantDetail`
  - [ ] UI: vertical timeline with icons per event type
- [ ] **M22. Application form validation polish**
  - [ ] Inline errors on blur, not just submit
  - [ ] ARIA `aria-invalid` + `aria-describedby`
  - [ ] Focus first error on submit
- [ ] **M23. Signed URLs for GCS resume access**
  - [ ] `getSignedReadUrl(bucket, key, 15min)` in `src/lib/storage/`
  - [ ] Replace public URL usage everywhere that resume is fetched
  - [ ] Integration payload uses signed URL (resumes expire in 15 min)

## Sprint 5 — Architectural upgrades

- [ ] **H1. pg-boss worker for resume parsing**
  - [ ] `src/server/workers/parse-resume.ts`
  - [ ] Boot queue at startup (separate process or app init)
  - [ ] Enqueue from `submitJobApplication` instead of fire-and-forget
  - [ ] Worker handles 3x retries with exponential backoff
  - [ ] Updates `parsingStatus` per attempt
- [ ] **H2. pg-boss worker for webhook dispatch**
  - [ ] `src/server/workers/dispatch-webhook.ts`
  - [ ] Replace fire-and-forget in `moveApplicant`
  - [ ] Persist IntegrationLog before send (for retry traceability)
  - [ ] Retries on 5xx, never on 4xx
- [ ] **H3. Idempotent stage transition / webhook**
  - [ ] Migration: add `transitionKey` unique constraint on `IntegrationLog`
  - [ ] Compute `transitionKey = hash(applicantId + toStageId + bucket(timestamp, 5s))`
  - [ ] Dedups same-trigger double-fire
  - [ ] Distinct from manual retry path (allowed)
- [ ] **H4. Vitest unit tests** for critical services
  - [ ] `jobs/create` — slug generation, uniqueness, default stages
  - [ ] `pipeline/stages` — create/reorder/delete-with-reassign
  - [ ] `applications/submit` — duplicate email per-job rejection
  - [ ] `templates/duplicate` and `templates/snapshot-to-job`
- [ ] **H5. Playwright E2E smoke test**
  - [ ] Install `@playwright/test` (dev dep)
  - [ ] `tests/e2e/smoke.spec.ts` covers 6 critical flows (see UX-TEST-PROTOCOL.md)
  - [ ] Screenshots per step in `tests/e2e/screenshots/`
  - [ ] Add to `.github/workflows/ci.yml`
- [ ] **H6. API documentation** `docs/API.md`
  - [ ] Every public + admin endpoint
  - [ ] Request/response shape, auth, examples
- [ ] **H7. Performance indexes**
  - [ ] Migration: `@@index([jobId, createdAt])` on Applicant
  - [ ] GIN index on `parsedData->'skills'` (Postgres jsonb)
  - [ ] `@@index([jobId, pipelineStageId])` on Applicant
  - [ ] EXPLAIN ANALYZE on filter queries to confirm

## Sprint 6 — Optional / bonus

- [ ] **H8. RBAC: enable RECRUITER read-only access**
- [ ] **H9. Admin invite system**
- [ ] **H10. Rate limiting on `/api/public/*`** (per-IP)

---

## Spec checklist (deliverables)

- [ ] All Recorded Demo flows recordable end-to-end without dead-ends
- [ ] Deployed URL in README, matches main branch
- [ ] `.env.example` documents every required variable
- [ ] `docs/API.md` complete
- [ ] Codespaces verified — `pnpm install && pnpm prisma:migrate && pnpm dev` works clean
- [ ] Sample data seed produces ≥20 applicants across ≥3 jobs
- [ ] Playwright smoke green
- [ ] Manual mobile/tablet/desktop sanity pass
