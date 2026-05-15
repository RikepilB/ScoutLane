# ScoutLane API Reference

This document covers the two callable surfaces of ScoutLane:

1. **REST endpoints** under `src/app/api/*` — used by the public application form, admin UI fetches, exports, integration tests, and (eventually) external callers.
2. **Server Actions** under `src/server/services/*` — invoked directly from React Server Components or `"use client"` forms via Next.js Server Actions.

Most mutations live in Server Actions, not REST. The thin REST surface mostly serves CSV exports, the public application form, integration test/retry, and a few admin reads.

---

## 1. Auth model

All requests pass through `src/middleware.ts`. Roles are read from the JWT session populated by Auth.js (`src/lib/auth/auth.ts`).

- **Workspace roles** (`ADMIN | RECRUITER | HIRING_MANAGER`) may access `/admin/*` and `/api/admin/*`.
- Any other authenticated role hitting an admin path is redirected to `/access-denied`.
- **Public bypass** — these paths skip auth: `/`, `/signin`, `/access-denied`, `/api/health`, `/careers`, `/careers/*`, `/api/public/*`, plus a small list of static files (`robots.txt`, `sitemap.xml`, `manifest.*`, `favicon.*`).
- Most `/api/admin/*` handlers also re-check the session and verify the resource belongs to `user.organizationId` before responding (defense in depth, in case the middleware matcher misses an edge case).

Server Actions that mutate data call `requireSession()` from `src/server/services/_lib/validate-session.ts` and scope queries by `organizationId`. Admin-only operations (org settings, team roles) additionally check `role === "ADMIN"`.

---

## 2. Error conventions

Two response shapes exist. They are not unified — be defensive on the client.

| Shape | Used by |
|---|---|
| `{ success: boolean; error?: string; ... }` | Server Actions, public application routes |
| `{ error: string }` (no `success` key on failure) | Most `/api/admin/*` routes |

When in doubt, branch on `response.ok` (HTTP status) first, then optionally inspect the body.

---

## 3. REST endpoints

### `GET /api/health`

Source: `src/app/api/health/route.ts`

- **Auth:** none.
- **Response 200:** `{ status: "ok", timestamp: "<ISO-8601>" }`
- Marked `dynamic = "force-dynamic"` — never cached.

---

### `GET|POST /api/auth/[...nextauth]`

Source: `src/app/api/auth/[...nextauth]/route.ts`

Auth.js v5 catch-all. Standard NextAuth handler — see [authjs.dev](https://authjs.dev/reference/nextjs) for the protocol. Providers are configured in `src/lib/auth/auth.config.ts` (Edge-safe) and `src/lib/auth/auth.ts` (full instance with `PrismaAdapter`).

---

### `GET /api/admin/jobs/[id]/form`

Source: `src/app/api/admin/jobs/[id]/form/route.ts`

Returns the custom-field schema attached to a job (used by the public application form's dynamic-field renderer).

- **Auth:** workspace role (middleware-gated). Does **not** re-scope by `organizationId` — relies on the middleware. Caller knows the job id.
- **Response 200:** `{ customFields: unknown[] }` (empty array if none)
- **Response 404:** `{ error: "Job not found" }`

---

### `GET /api/admin/jobs/[id]/pipeline`

Source: `src/app/api/admin/jobs/[id]/pipeline/route.ts`

Returns the kanban view: stages plus the applicants placed in each. Applicants whose `pipelineStageId` is `null` are bucketed into the first stage.

- **Auth:** workspace role.
- **Response 200:** Array of stage objects:
  ```jsonc
  [
    {
      "id": "stage_abc",
      "name": "Screening",
      "color": "#9ca3af",
      "order": 1,
      "applicants": [
        {
          "id": "app_xyz",
          "name": "Alex Doe",
          "email": "alex@example.com",
          "score": 0.82,
          "status": "REVIEWING",
          "createdAt": "2026-05-15T12:00:00.000Z",
          "lastStageChangeAt": "2026-05-15T13:00:00.000Z",
          "interviewDate": null,
          "institution": "MIT",
          "program": "Computer Science"
        }
      ]
    }
  ]
  ```

---

### `POST /api/admin/jobs/[id]/integrations`

Source: `src/app/api/admin/jobs/[id]/integrations/route.ts`

Attach a per-stage outbound integration to a job. One integration per stage (`stageId` is `@unique` on `JobIntegration`).

- **Auth:** signed-in user with `organizationId`. Verifies the job belongs to the same org.
- **Body:**
  ```json
  {
    "stageId": "stage_abc",
    "endpointUrl": "https://example.com/scoutlane-hook",
    "apiKey": "optional-bearer-token",
    "includeQuestions": false
  }
  ```
- **Response 201:** `{ success: true, integration: JobIntegration }`
- **400:** `{ error: "stageId and endpointUrl are required" }`
- **401 / 403 / 404:** auth or scope failure.

---

### `POST /api/admin/jobs/integrations/[integrationId]?action=test|retry`

Source: `src/app/api/admin/jobs/integrations/[integrationId]/route.ts`

Two actions on an existing integration, selected by the `action` query param.

- **Auth:** signed-in user; integration's job must belong to the user's org.
- **`?action=test`** — POSTs a synthetic `stage_transition` payload (using `sample-applicant` data) to `endpointUrl`. Stored as an `IntegrationLog` with `event: "integration_test"`.
- **`?action=retry`** — re-POSTs the most recent failed `stage_transition` request body (or the most recent transition if no failures). Updates `lastSuccessAt`/`lastFailureAt`/`failureCount` on the integration based on response.
- **Response 200:** `{ ok: true, status: <httpStatus> }`
- **Response 500 (network error):** `{ ok: false, error: "<message>" }`
- **400:** `{ error: "No prior request to retry" }` or `{ error: "Unsupported action" }`

### `DELETE /api/admin/jobs/integrations/[integrationId]`

Same source file.

- **Auth:** as above.
- **Response 200:** `{ success: true }`

---

### `POST /api/admin/jobs/parse-retry/[applicantId]`

Source: `src/app/api/admin/jobs/parse-retry/[applicantId]/route.ts`

Re-enqueues an applicant's resume into the pg-boss `resume-parse` queue. Sets `parsingStatus = PENDING` before enqueue; reverts to `FAILED` if the enqueue itself throws (the worker handles parse failures separately).

- **Auth:** signed-in user; applicant's job must belong to user's org.
- **Pre-check:** `400` if applicant has no `resumeUrl`.
- **Response 200:** `{ success: true, status: "PENDING", jobId: "<pg-boss-job-id>" }`
- **Response 500:** `{ success: false, status: "FAILED" }`

---

### `GET /api/admin/jobs/[id]/applicants/export`

Source: `src/app/api/admin/jobs/[id]/applicants/export/route.ts`

Downloadable CSV of all applicants for a job.

- **Auth:** signed-in user; job org-scoped.
- **Columns:** `id, name, email, phone, pipelineStage, status, appliedAt, resumeUrl, parsingStatus`
- **Response 200:** `text/csv; charset=utf-8`, `Content-Disposition: attachment; filename="applicants-<slug>.csv"`
- Values containing `"`, `,`, or newline are quoted and inner `"` doubled per RFC 4180.

---

### `POST /api/public/jobs/[slug]/applications`

Source: `src/app/api/public/jobs/[slug]/applications/route.ts`

**JSON-only** public submit. **Does not handle file uploads** — the production apply flow goes through the `submitJobApplication` Server Action (multipart form data with `resumeFile`). This REST route is for lightweight integrations / status checks.

- **Auth:** none (public).
- **Body:**
  ```json
  {
    "firstName": "Alex",
    "lastName": "Doe",
    "email": "alex@example.com",
    "phone": "+1-555-0100"
  }
  ```
  Field rules (Zod, `publicApplicationSchema` in route file):
  - `firstName`, `lastName`: 1–64 chars, letters / accents / `- ' ` space only
  - `email`: valid email, ≤320 chars
  - `phone`: 7–20 chars, digits / `+ - ( ) ` space only
  - `resumeUrl` in body → rejected with `400`
- **Response 201:** `{ success: true, applicant: { id, status: "NEW" } }`
- **Response 400:** validation failure or job not accepting applications (`canAcceptApplications(job)` in `src/lib/jobs/status.ts`)
- **Response 404:** `{ success: false, error: "Job not found" }`
- **Response 409:** `{ success: false, field: "email", error: DUPLICATE_APPLICATION_MESSAGE }` (already applied with same email for this job)

### `GET /api/public/jobs/[slug]/applications?applicationId=<id>`

Lookup status for a previously submitted application (used by the post-submit "track your application" UI).

- **Auth:** none.
- **Response 200 (found):** `{ success: true, data: { id, status, jobSlug } }`
- **Response 200 (not found / mismatch):** `{ success: true, data: null }` — does not 404, to avoid enumerating applicants.

---

## 4. Server Actions

Server Actions live in `src/server/services/`. Each action follows a two-file pattern: `*.ts` is the `"use server"` wrapper (dynamic-imports the impl), and `*-impl.ts` holds the pure implementation so it can be unit-tested without crossing the action boundary (see `src/server/services/jobs/create-impl.test.ts`).

### Jobs (`src/server/services/jobs/`)

| Action | Signature | Notes |
|---|---|---|
| `createJob` | `(formData: FormData) → Promise<JobActionResult>` | Validates via `jobCreationSchema`; copies `descriptionUrl`, `stageNames`, `questions`, `customFields` from optional template; auto-creates an Organization if user has none. |
| `updateJob` | `(id, data: UpdateJobInput) → Promise<JobActionResult>` | Org-scoped. |
| `saveCustomFields` | `(jobId, customFields: unknown[]) → ...` | Replaces the job's `customFields` JSON column. |
| `deleteJob` | `(id) → Promise<JobActionResult>` | Cascades to stages/applicants/integrations via Prisma `onDelete: Cascade`. |
| `getJob` | `(id) → Job | null` | Read; org-scoped. |

### Pipeline (`src/server/services/pipeline/`)

| Action | Signature |
|---|---|
| `getPipelineData` | `(jobId)` |
| `createStage` | `(jobId, name, color?)` |
| `updateStage` | `(stageId, { name?, color?, order? })` |
| `deleteStage` | `(stageId, reassignToStageId?)` |
| `reorderStages` | `({ id, order }[])` |
| `moveApplicant` | `(applicantId, newStageId)` |

`moveApplicant` is the central pipeline operation. It writes to `Applicant`, creates a `StageTransition`, fans out to active `Webhook`s (`applicant.status_changed`), and — if a `JobIntegration` exists for the target stage — POSTs to its `endpointUrl` with idempotency keyed by `stageTransitionId`. See `update-impl.ts:27-204` for the full flow.

The applicant's `status` enum is **derived** from the target stage's name via a static map (`stageNameToStatus` in `update-impl.ts:8-21`). Stage names that don't match a known key fall back to `REVIEWING`.

### Applicants (`src/server/services/applicants/`)

| Action | Signature |
|---|---|
| `getApplicants` | `({ jobId, search, status, sortBy, sortOrder })` |
| `getApplicantDetail` | `(applicantId)` |
| `updateApplicantStatus` | `(applicantId, status)` |
| `updateApplicantNotes` | `(applicantId, notes)` — the deprecated single-string `notes` column |
| `saveApplicantResumeDataJson` | `(applicantId, jsonText)` — overwrites parsed resume JSON |
| `updateInterviewDate` | `(applicantId, interviewDate \| null)` |
| `createApplicantNote` | `(applicantId, body)` — appends to `ApplicantNote` table |
| `updateApplicantNote` | `(noteId, body)` |
| `deleteApplicantNote` | `(noteId)` |

### Templates (`src/server/services/templates.ts`)

| Action | Signature |
|---|---|
| `createTemplate` | `()` — creates a stub template and redirects to its editor |
| `updateTemplate` | `(id, formData)` |
| `duplicateTemplate` | `(id)` |
| `deleteTemplate` | `(id)` |

Applying a template to a job is a **snapshot copy** of `descriptionUrl`, `stageNames`, `questions`, and `customFields` onto the `Job` row. Editing the template afterward does not retroactively change existing jobs.

### Settings (`src/server/services/settings.ts`)

| Action | Auth |
|---|---|
| `updateMyProfile(formData)` | Any signed-in user |
| `updateOrganizationSettings(formData)` | `ADMIN` only |
| `updateTeamMemberRole(formData)` | `ADMIN` only |

### Application submit (`src/server/services/submit-job-application.ts`)

- `submitJobApplication(formData) → Promise<ApplicationActionResult>`
- Validates via `jobApplicationSubmissionSchema` (resume file + name/email/phone + `jobSlug`).
- Uploads the resume to GCS, creates the `Applicant`, calls `enqueueResumeParse(applicantId, resumeUrl)`, then `sendApplicationConfirmation` (Resend).
- Returns `{ success: true }` on accept, `{ success: false, error, field? }` on validation/duplicate/upload failure.

---

## 5. Outbound integrations

Two **distinct** outbound mechanisms — easy to confuse, do not conflate.

### a) Organization-wide webhooks

- Model: `Webhook` (table-level; not per-job).
- Dispatcher: `dispatchWebhook(webhookId, event, data)` in `src/lib/webhook/dispatch.ts`.
- Triggered from `moveApplicantImpl` for the `applicant.status_changed` event (`update-impl.ts:92-106`).
- Headers:
  - `Content-Type: application/json`
  - `X-Webhook-Event: <event>`
  - `X-Webhook-Signature: <hmac>` — see `src/lib/webhook/sign.ts` for algorithm.
- Body:
  ```json
  {
    "event": "applicant.status_changed",
    "timestamp": "<ISO-8601>",
    "data": {
      "applicantId": "...",
      "name": "...",
      "email": "...",
      "stageId": "...",
      "stageName": "...",
      "status": "REVIEWING",
      "jobTitle": "..."
    }
  }
  ```
- Every attempt is recorded in `WebhookLog` regardless of outcome.

### b) Per-stage job integrations

- Model: `JobIntegration` — keyed to a job and a single `PipelineStage` (`stageId @unique`).
- Triggered from `moveApplicantImpl` when an applicant lands on a stage that has an active integration (`update-impl.ts:108-199`).
- Headers:
  - `Content-Type: application/json`
  - `Authorization: Bearer <apiKey>` (only if `apiKey` is non-empty)
- Body:
  ```jsonc
  {
    "event": "stage_transition",
    "timestamp": "<ISO-8601>",
    "candidate": {
      "id": "...",
      "name": "...",
      "email": "...",
      "phone": "...",
      "resumeUrl": "..."
    },
    "assessment": {              // only when integration.includeQuestions === true
      "title": "Senior Engineer",
      "description": "Please answer each question concisely.",
      "questions": [/* normalized */]
    }
  }
  ```
- **Idempotency** — before POSTing, the dispatcher looks for any prior `IntegrationLog` with the same `(integrationId, stageTransitionId)` and `status 2xx`. If found, the POST is skipped.
- Each attempt is recorded in `IntegrationLog` with `event = "stage_transition" | "integration_test" | "integration_retry"`.
- The `?action=test` payload uses the same envelope but with a synthetic `sample-applicant`.

---

## 6. Status codes summary

| Code | When |
|---|---|
| `200` | Successful read or update |
| `201` | New resource created |
| `400` | Validation failure / bad action / disallowed input |
| `401` | Not authenticated (admin routes that re-check) |
| `403` | Authenticated but missing org / role |
| `404` | Resource not found, or not in caller's org (does not leak existence) |
| `409` | Duplicate application for same `(job, email)` |
| `500` | Unhandled exception (logged server-side) |

---

## 7. Related files

- Middleware & auth gate: `src/middleware.ts`
- Auth config split: `src/lib/auth/auth.config.ts`, `src/lib/auth/auth.ts`
- Prisma client (use this import, not `@prisma/client`): `@/generated/prisma/client`
- Zod schemas shared by client + server: `src/schemas/*.ts`
- Job status helpers: `src/lib/jobs/status.ts`
- Resume parse queue: `src/lib/queue/resume.ts`, worker at `src/server/workers/resume-parser.ts`
- Worker entrypoint: `scripts/worker.ts` (run with `pnpm worker`)
