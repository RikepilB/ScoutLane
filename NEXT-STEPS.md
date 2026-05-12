# ScoutLane — Next Steps & TODOs

> Features not yet started. Organized by phase for the next development cycles.

---

## Phase 1: Quick Fixes (Foundation)

### TODO: Fix Route Structure
- [ ] Flatten `(admin)/admin/` -> `(admin)/dashboard/`
- [ ] Move all admin sub-routes up one level
- [ ] Update Sidebar.tsx nav links
- [ ] Remove `.gitkeep` files from non-empty dirs
- [ ] Add barrel exports (`index.ts`) to all `src/*/` directories
- [ ] Fix broken imports (e.g., `@/server/services/applicants/update` -> actual path)

### TODO: Infrastructure Libs
- [ ] Implement `src/lib/queue/` with pg-boss client
- [ ] Implement `src/lib/webhook/` with dispatch + HMAC signing
- [ ] Create `src/lib/utils/date.ts` (compact relative time: `1h`, `3d`, `2w`, `2mo`, `1yr`)
- [ ] Create `src/lib/utils/rate-limit.ts`
- [ ] Convert flat libs to directories: `email/`, `storage/`, `jobs/`, `llm/`
- [ ] Update imports across the app after lib reorg

### TODO: Quality Fixes
- [ ] Replace `any` types in `applicants.ts` with proper typed interfaces
- [ ] Align storage env vars with `.env.example` (S3/R2 instead of GCS)
- [ ] Add `@faker-js/faker` to `devDependencies` in `package.json`
- [ ] Add `noindex`, `norobots` meta tags to careers layout
- [ ] Add custom 404 page (`not-found.tsx`)
- [ ] Add custom error page (`error.tsx`)

---

## Phase 2: Data Model & Schema

### TODO: Stage Transition Logging
- [ ] Add `StageTransition` model to Prisma schema:
  ```prisma
  model StageTransition {
    id           String   @id @default(cuid())
    applicantId  String
    applicant    Applicant @relation(fields: [applicantId], references: [id], onDelete: Cascade)
    jobId        String
    fromStage    String?
    toStage      String
    changedById  String?
    changedBy    User?    @relation(fields: [changedById], references: [id])
    createdAt    DateTime @default(now())
  }
  ```
- [ ] Generate migration
- [ ] Update `moveApplicant()` service to log transitions
- [ ] Build activity timeline UI on applicant detail page

### TODO: Resume Parsing Status
- [ ] Add `ParsingStatus` enum to Prisma: `PENDING`, `PARSING`, `COMPLETED`, `FAILED`
- [ ] Add `parsingStatus` field to `Applicant` model
- [ ] Add `parsedData` JSON field to `Applicant` model
- [ ] Generate migration
- [ ] Show parsing status indicator in applicant list + detail

### TODO: Custom Field Persistence
- [ ] Add `customFields` JSON field to `Job` model:
  ```prisma
  customFields Json?
  ```
- [ ] Generate migration
- [ ] Save custom fields from form builder to DB
- [ ] Render custom fields dynamically on public application form
- [ ] Store custom field values on `Applicant` model

### TODO: Assessment Questions in Templates
- [ ] Add `assessmentQuestions` JSON field to `JobTemplate` model
- [ ] Define schema in `src/schemas/assessment.ts`:
  ```
  { text: string, maxDurationSeconds: number, maxAttempts: number }
  ```
- [ ] Update template editor to manage assessment questions
- [ ] Default 4 questions on template creation
- [ ] Include in external integration payload

### TODO: External Integration Models
- [ ] Add `JobIntegration` model:
  - `id`, `jobId`, `stageId`, `endpointUrl`, `apiKey`, `includeQuestions`, `active`, `lastSuccessAt`, `lastFailureAt`, `failureCount`
- [ ] Add `IntegrationLog` model:
  - `id`, `integrationId`, `status`, `requestBody`, `responseBody`, `createdAt`
- [ ] Generate migration

### TODO: Applicant Notes
- [ ] Create `ApplicantNote` model (separate from inline notes)
  - `id`, `applicantId`, `content`, `authorId`, `createdAt`, `updatedAt`
- [ ] Migrate existing notes data
- [ ] Build notes UI: add, edit, delete with timestamps

---

## Phase 3: Core Features

### TODO: Async Resume Parsing Pipeline
- [ ] Create `src/server/workers/resume-parser.ts` (pg-boss worker)
- [ ] Initialize pg-boss in app startup
- [ ] On application submit: set `parsingStatus=PENDING`, enqueue parse job
- [ ] Worker: call Gemini API, update `parsedData` + `parsingStatus=COMPLETED`
- [ ] On failure: set `parsingStatus=FAILED`, store error
- [ ] Admin UI: show parsed data with loading state
- [ ] Retry button: re-enqueue parse job
- [ ] Manual edit UI for parsed fields

### TODO: External Service Integration
- [ ] Create `src/server/services/integrations.ts` (CRUD for integrations)
- [ ] Create `src/lib/webhook/dispatch.ts` (POST with payload construction)
- [ ] Create `src/server/workers/webhook-worker.ts` (background delivery)
- [ ] Update pipeline stage transition: check for active integration, fire webhook
- [ ] Build integration config UI (per-job, per-stage)
- [ ] Build integration log dashboard (success/failure history)
- [ ] Implement idempotency keys to prevent duplicate sends
- [ ] Add "Test integration" button with sample payload
- [ ] Error handling: log failures, don't block pipeline

### TODO: Activity Timeline
- [ ] Build timeline component for applicant detail
- [ ] Show: application submitted, stage changes (with before/after), notes added
- [ ] Format timestamps in relative + absolute format

### TODO: Stage Delete Handling
- [ ] Add confirmation dialog before deleting a stage
- [ ] Handle applicants in the deleted stage (option to reassign or warn)

---

## Phase 4: Analytics & Dashboard

### TODO: Charts & Visualizations
- [ ] Application volume over time (line/bar chart, filterable by date range)
- [ ] Distribution by institution (top schools from parsed data)
- [ ] Distribution by degree program / field of study
- [ ] Stage-by-stage breakdown with counts and conversion rates
- [ ] Add charts section to job overview page

### TODO: Advanced Applicant List
- [ ] Upgrade filtering: institution, degree, skills (multi-select), date range
- [ ] Add grouping: group by institution, degree, pipeline stage
- [ ] Upgrade sorting: all fields including parsed data
- [ ] Full-text search across name, email, institution, skills, parsed resume data
- [ ] Add institution + program + skills preview to each row
- [ ] Filter/sort state persists in URL query params

### TODO: Embedded Resume Viewer
- [ ] Integrate PDF.js or Google Docs viewer
- [ ] Show resume inline on applicant detail page
- [ ] Side-by-side view: parsed data vs original resume

---

## Phase 5: Pipeline UX

### TODO: Kanban Card Improvements
- [ ] Add institution, degree program to applicant cards
- [ ] Add compact relative time in current stage (`1h`, `20h`, `3d`, `2w`, `2mo`)
- [ ] Improve card layout for information density
- [ ] Sync board view with list view (changes reflected immediately)

### TODO: Pipeline UX Polish
- [ ] Drag-and-drop custom field reorder in form builder
- [ ] Template duplicate functionality
- [ ] Template preview (show form fields as they appear to applicants)
- [ ] Mobile responsive admin layout
- [ ] Empty states for all views

---

## Phase 6: Tests

### TODO: Test Infrastructure
- [ ] Create test factories: `job.ts`, `applicant.ts`, `user.ts`, `template.ts`
- [ ] Create mocks: `prisma.ts`, `auth.ts`, `storage.ts`, `email.ts`
- [ ] Configure Vitest properly

### TODO: Service Tests
- [ ] `jobs.test.ts` — create, update, delete, status transitions
- [ ] `applicants.test.ts` — CRUD, filtering, sorting
- [ ] `pipeline.test.ts` — stage CRUD, reorder, move applicant
- [ ] `applications.test.ts` — submit, duplicate rejection, closed job

### TODO: Schema Validation Tests
- [ ] `application.test.ts` — valid/invalid submissions, file validation
- [ ] `job.test.ts` — creation schema, status transitions
- [ ] `settings.test.ts` — org settings, team roles

### TODO: Component Tests
- [ ] `ApplicationForm.test.tsx` — renders fields, validation, submission
- [ ] `NewJobForm.test.tsx` — form rendering, template prefill

### TODO: API Route Tests
- [ ] `health.test.ts` — health endpoint
- [ ] `pipeline.test.ts` — pipeline data endpoint
- [ ] `applications.test.ts` — public submission endpoint

### TODO: E2E Tests
- [ ] Playwright: create job -> publish -> apply as candidate -> review in admin -> move in pipeline

---

## Phase 7: Polish & Deploy

### TODO: UX Polish
- [ ] Loading skeletons for all pages (maintain layout stability)
- [ ] Error boundaries per route group
- [ ] Keyboard shortcuts: `n` for new job, `/` for search, `1-5` for tabs
- [ ] Responsive design (mobile + tablet + desktop)
- [ ] Consistent spacing, typography, color usage

### TODO: Deployment
- [ ] Deploy to Vercel
- [ ] Set up Neon PostgreSQL
- [ ] Set up Cloudflare R2 for file storage
- [ ] Configure environment variables
- [ ] Configure Resend for email
- [ ] Configure Google OAuth credentials
- [ ] Verify deployed app end-to-end
- [ ] Test in GitHub Codespaces

### TODO: Documentation
- [ ] Update README with architecture overview
- [ ] Add API documentation (endpoints, request/response formats)
- [ ] Add local development setup instructions
- [ ] Add environment variable configuration guide
- [ ] Document architecture tradeoffs
- [ ] Document template data model (linked vs snapshot approach)

### TODO: Recorded Demo
- [ ] Record 10-15 min demo showing:
  - Templates creation
  - Job management with template apply
  - Public careers experience
  - Admin dashboard with analytics
  - Applicant list with filters/sorting/grouping
  - Applicant detail with parsed resume data
  - Kanban pipeline with drag-and-drop
  - External integration config + webhook demo
  - Charts and visualizations

---

## Progress Tracking

- **Phase 1:** `0 / 18` tasks
- **Phase 2:** `0 / 18` tasks
- **Phase 3:** `0 / 18` tasks
- **Phase 4:** `0 / 11` tasks
- **Phase 5:** `0 / 9` tasks
- **Phase 6:** `0 / 19` tasks
- **Phase 7:** `0 / 15` tasks

**Total: 0 / 108 tasks completed**

> This document represents features not yet started. As work progresses, check off items and move completed items to a CHANGELOG or a completed status section.
