# ScoutLane — Assessment Gap Analysis & Action Plan

> Generated: May 12, 2026 | Repo: `github.com/RikepilB/ScoutLane.git`

---

## 1. Assessment Requirements vs Current State

### 1.1 Job Management

| Requirement | Status | Notes |
|------------|--------|-------|
| Create job: title, description, slug, status | ✅ Done | `createJob()` in services |
| Job statuses: Draft, Active, Closed | ✅ Done | `getJobStatus()` in `lib/jobs.ts` |
| URL slug auto-generated + **editable by admin** | ⚠️ Partial | Auto-generated with UUID suffix but NOT editable after creation |
| Rich text / markdown for job description | ❌ Missing | Only plain text `textarea` |
| Default form fields (first name, last name, email, phone, resume) | ✅ Done | `application.ts` schema |
| Custom fields: label, type, required/optional, dropdown options | ⚠️ Partial | Form builder page exists but **NOT persisted to DB** |
| Custom fields: drag-and-drop reorder | ❌ Missing | UI shows `GripVertical` icon but no actual DnD |
| Custom field dropdown: options list | ❌ Missing | Schema has no dropdown options field |

### 1.2 Public Job Pages

| Requirement | Status | Notes |
|------------|--------|-------|
| `/careers/{job-slug}` URL | ✅ Done | Route exists |
| Non-indexable (noindex, norobots) | ❌ Missing | No meta tags on careers pages |
| Job description rendered from rich text/markdown | ❌ Missing | Plain text only |
| Form validation with clear feedback | ✅ Done | Zod + react-hook-form |
| Confirmation message on submit | ✅ Done | |
| Confirmation email | ✅ Done | Resend integration |
| Duplicate email rejection per job | ✅ Done | In `applications.ts` |
| Closed job message | ✅ Done | `canAcceptApplications()` check |

### 1.3 Resume Parsing

| Requirement | Status | Notes |
|------------|--------|-------|
| AI-powered extraction | ✅ Done | Gemini 2.5 Flash integration |
| **Async parsing** (applicant not blocked) | ❌ Missing | Currently synchronous |
| "Parsing..." indicator in dashboard | ❌ Missing | No status field for parsing state |
| Parsing error state + retry button | ❌ Missing | No error handling for parsing |
| Extracted fields: name, email, phone, education, work, skills | ✅ Done | Schema in `llm.ts` |
| Manual correction of parsed data | ❌ Missing | No edit UI for parsed fields |
| Original resume always accessible | ✅ Done | `resumeUrl` stored |

### 1.4 Admin Dashboard & Analytics

| Requirement | Status | Notes |
|------------|--------|-------|
| Job selection page (all jobs by status) | ✅ Done | Admin dashboard page |
| Key stats per job (total, new, stage distribution) | ⚠️ Partial | Basic stats shown |
| **Charts**: application volume over time | ❌ Missing | No charts library integrated |
| **Charts**: distribution by institution | ❌ Missing | No education data pipeline |
| **Charts**: distribution by degree/field | ❌ Missing | No education data pipeline |
| **Applicant sorting**: date, name, institution, degree, stage | ⚠️ Partial | By date and name only |
| **Applicant filtering**: stage, institution, degree, skills, date range | ⚠️ Partial | By stage only |
| **Applicant grouping**: institution, degree, stage | ❌ Missing | None |
| **Full-text search**: name, email, institution, skills, parsed data | ⚠️ Partial | Name + email only |
| Applicant row: enough info at a glance | ⚠️ Partial | Missing education/skills preview |
| Applicant detail: parsed info display | ❌ Missing | Only shows raw fields (name, email, phone, score) |
| Applicant detail: **embedded resume viewer** | ❌ Missing | Only external link |
| Applicant detail: custom field values | ❌ Missing | Not stored currently |
| Applicant detail: activity timeline | ❌ Missing | No stage transition logging |
| Applicant detail: admin notes (add, edit, delete with timestamps) | ⚠️ Partial | Notes exist but no timestamps or edit/delete |

### 1.5 Configurable Pipeline

| Requirement | Status | Notes |
|------------|--------|-------|
| Per-job configurable stages | ✅ Done | `PipelineStage` model |
| Create, rename, reorder, delete stages | ✅ Done | In `pipeline.ts` services |
| Default stages (Applied → Rejected) | ✅ Done | In `createJob()` |
| Kanban board view | ✅ Done | dnd-kit implementation |
| Applicant cards: name, institution, program, **time in stage** | ❌ Missing | Only shows name, email, score, date |
| Time in stage: compact relative format (`1h`, `3d`, `2w`) | ❌ Missing | |
| **Stage transition logging** with prev/new/timestamp/admin | ❌ Missing | No model or implementation |
| Board and list views synchronized | ❌ Missing | No list view with drag |
| Delete stage: handle applicants in that stage | ❌ Missing | No confirmation/handling |

### 1.6 Templates

| Requirement | Status | Notes |
|------------|--------|-------|
| Template CRUD | ✅ Done | `templates.ts` services |
| Template includes custom form fields | ⚠️ Partial | Schema has `questions` field but structure not matching spec |
| Template includes **assessment questions** | ❌ Missing | Not in current template structure |
| Assessment questions: text, maxDurationSeconds, maxAttempts | ❌ Missing | |
| Default 4 assessment questions on creation | ❌ Missing | |
| Custom field reorder in template | ❌ Missing | |
| Duplicate template | ❌ Missing | |
| Preview template | ❌ Missing | |
| Apply template to job (snapshot approach) | ✅ Done | In `createJob()` |

### 1.7 External Service Integration

| Requirement | Status | Notes |
|------------|--------|-------|
| Per-job integration configuration | ❌ Missing | No model |
| Configure: trigger stage, endpoint URL, API key, include questions, active/paused | ❌ Missing | |
| POST on stage transition with correct payload | ❌ Missing | |
| Payload includes assessment questions (optional) | ❌ Missing | |
| Failures don't block pipeline | ❌ Missing | |
| Failed calls logged with error | ❌ Missing | |
| Admin retry for failed calls | ❌ Missing | |
| Idempotency (no duplicate sends) | ❌ Missing | |
| Integration dashboard (history, status) | ❌ Missing | |
| "Test integration" button | ❌ Missing | |

### 1.8 Authentication & Infrastructure

| Requirement | Status | Notes |
|------------|--------|-------|
| Google OAuth | ✅ Done | |
| Public portal without auth | ✅ Done | |
| Secure sessions (httpOnly) | ✅ Done | NextAuth default |
| `INITIAL_ADMIN_EMAIL` bootstrap | ✅ Done | |
| Role-based access (Admin, Reviewer) | ⚠️ Partial | Admin/Recruiter/HiringManager exist but no route guards |
| Tests: unit, integration, E2E | ❌ Missing | Zero tests |
| Deployment | ❌ Missing | Not deployed |
| Docker Compose for PostgreSQL | ✅ Done | |
| `.env.example` with all variables | ✅ Done | |
| CI workflow | ✅ Done | |
| Codespaces support | ✅ Done | |

---

## 2. Gap Severity Summary

### 🔴 Critical (Blocks Submission)
1. **Branches not merged** — all feature code sits in 7+ unmerged branches
2. **Zero tests** — any submission without tests will fail evaluation
3. **No deployment** — requirement says "provide a deployed URL"
4. **Async resume parsing** — requirement says "applicant must not wait"
5. **External service integration** — entire section is missing
6. **Charts/visualizations** — required for analytics evaluation
7. **Stage transition logging** — feeds activity timeline
8. **Custom field persistence** — form builder is a UI demo only
9. **Assessment questions in templates** — required for integration payload

### 🟡 High Priority
1. Route structure `(admin)/admin/` anti-pattern
2. Applicant detail: no parsed data display, no resume viewer, no timeline
3. Kanban cards: missing institution/program/time-in-stage
4. Filtering/sorting/grouping: too basic
5. Rich text description support
6. Admin notes with timestamps + edit/delete
7. noindex/norobots on careers pages
8. Error pages (404, 500)

### 🟢 Lower Priority (Polish)
1. Barrel exports
2. `.gitkeep` cleanup
3. `any` types cleanup
4. Empty/Loading/Error states
5. Keyboard shortcuts
6. Mobile responsiveness
7. GCS -> S3 env var alignment
