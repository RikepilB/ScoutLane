# ScoutLane API Reference

Last reviewed: 2026-09-04.

ScoutLane has two callable surfaces:

- REST endpoints under `src/app/api/*`.
- Server Actions under `src/server/services/*`.

Most admin mutations are Server Actions. REST routes are used for auth, health, public JSON application submit, admin reads, exports, integration testing/retry, parse retry, applicant rescoring, and job alerts.

For the take-home assessment's "agentic future" requirement, the current app is callable but not fully REST-complete. Treat Server Actions as the current internal command surface and the API parity checklist below as the work required before external agents can safely operate every workflow.

## Auth

Public endpoints bypass auth only when explicitly listed in `src/lib/auth/public-routes.ts`. Auth is Clerk-based; admin routes require an authenticated user with an organization, and most handlers scope data by `organizationId`.

Workspace roles:

- `ADMIN`
- `RECRUITER`
- `HIRING_MANAGER`
- `GUEST` (read-only; blocked from mutations by `assertNotGuest`)

**RBAC caveat (tracked as GAPS.md G5, unresolved):** role is checked at the `assertNotGuest`
granularity (any non-GUEST role passes) almost everywhere. `RECRUITER` and `HIRING_MANAGER`
can currently export applicant PII, delete jobs, and manage integrations — same as `ADMIN`.
Only `settings.ts` (org settings, team role changes) enforces an `ADMIN`-only check today.
Don't assume role-based authorization exists on a route unless you've checked that route.

## Error Shapes

The API is not fully normalized.

- Server Actions and public routes commonly return `{ success: boolean, error?: string }`.
- Admin REST routes often return `{ error: string }` on failure.

Client code should check `response.ok` first.

Target normalized shape for future endpoints:

```json
{
  "success": true,
  "data": {},
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-safe error message"
  }
}
```

Only one of `data` or `error` should be present. Error messages returned to candidates should stay generic and must not expose stack traces, SQL errors, provider responses, internal paths, tokens, or secrets.

## REST Endpoints

### `GET /api/health`

Open health check.

Response:

```json
{ "status": "ok", "timestamp": "2026-05-19T00:00:00.000Z" }
```

### `POST /api/webhooks/clerk`

Clerk webhook receiver (user/organization sync). Verifies the Svix signature; not
user-callable. Auth itself is handled by Clerk's own hosted endpoints and
`src/middleware.ts`, not an app-owned `/api/auth/*` route (the old NextAuth
`[...nextauth]` catch-all was removed in the Clerk migration).

### `GET /api/admin/jobs/[id]/form`

Returns custom application fields for a job.

Response:

```json
{ "customFields": [] }
```

### `POST /api/admin/jobs/[id]/form`

Saves the job's application form fields. Authenticated + org-scoped. Body is
validated with the shared `customFieldsSchema` (`src/schemas/template.ts`).
Accepts either a bare array or `{ "customFields": [...] }`.

Body:

```json
{ "customFields": [{ "id": "city", "label": "City", "type": "text", "required": false }] }
```

Responses: `200 { success: true }`, `400` invalid fields, `401`/`403` auth,
`404` job not found / not in org. Delegates to `saveCustomFieldsImpl`.

### `POST /api/admin/jobs/[id]/applicants/[applicantId]/move`

REST parity for the Kanban move. Authenticated + org-scoped. Delegates to
`moveApplicantImpl`, which updates stage/status, creates a `StageTransition`,
and dispatches active webhooks + the per-stage integration.

Body:

```json
{ "targetStageId": "stage_id" }
```

Responses: `200 { success: true }`, `400` invalid body / invalid stage,
`401`/`403` auth, `404` applicant not found / not in org.

### `GET /api/admin/jobs/[id]/pipeline`

Returns ordered pipeline stages with applicants grouped into each stage.

Applicants without `pipelineStageId` are placed in the first stage.

### `POST /api/admin/jobs/[id]/integrations`

Creates a per-stage outbound integration.

Body:

```json
{
  "stageId": "stage_id",
  "endpointUrl": "https://example.com/scoutlane",
  "apiKey": "optional-token",
  "includeQuestions": false
}
```

### `POST /api/admin/jobs/integrations/[integrationId]?action=test`

Sends a synthetic `stage_transition` payload to the integration URL and records an `IntegrationLog`.

### `POST /api/admin/jobs/integrations/[integrationId]?action=retry`

Retries the most recent failed or recent transition payload for the integration.

### `DELETE /api/admin/jobs/integrations/[integrationId]`

Deletes a job integration after verifying ownership.

### `POST /api/admin/jobs/parse-retry/[applicantId]`

Re-enqueues resume parsing for an applicant. Sets parsing status to `PENDING` before enqueue. Returns `FAILED` if enqueue itself fails.

### `POST /api/admin/applicants/[applicantId]/rescore`

Re-runs applicant match scoring for an applicant using the current parsed data and job context.

### `GET /api/admin/jobs/[id]/applicants/export`

Downloads applicants for a job as CSV.

Columns:

```text
id,name,email,phone,pipelineStage,status,appliedAt,resumeUrl,parsingStatus
```

### `POST /api/public/jobs/[slug]/applications`

Public JSON-only application submit. This endpoint does not upload files and is not the primary production apply flow. The real public form uses the `submitJobApplication` Server Action with multipart form data.

Rejects `resumeUrl` in the body.

### `GET /api/public/jobs/[slug]/applications?applicationId=<id>`

Public status lookup. Returns `data: null` instead of 404 when the id is not found or does not match the job.

### `POST /api/public/job-alerts`

Subscribes an email address to public job alerts. Backed by `JobAlert`.

## Server Actions

### Jobs

Files: `src/server/services/jobs/*`

- `createJob(formData)`
- `updateJob(id, data)`
- `deleteJob(id)`
- `getJob(id)`
- `saveCustomFields(jobId, customFields)`

`createJob` can snapshot template data into the new job, including stages, questions, custom fields, and description fields.

### Pipeline

Files: `src/server/services/pipeline/*`

- `getPipelineData(jobId)`
- `createStage(jobId, name, color?)`
- `updateStage(stageId, data)`
- `deleteStage(stageId, reassignToStageId?)`
- `reorderStages(stages)`
- `moveApplicant(applicantId, newStageId)`

`moveApplicant` is the central pipeline operation. It updates applicant stage/status, creates `StageTransition`, dispatches active webhooks, and dispatches configured per-stage integrations.

### Applicants

Files: `src/server/services/applicants/*`

- `getApplicants(filters)`
- `getApplicantDetail(applicantId)`
- `updateApplicantStatus(applicantId, status)`
- `updateApplicantNotes(applicantId, notes)`
- `saveApplicantResumeDataJson(applicantId, jsonText)`
- `updateInterviewDate(applicantId, interviewDate | null)`
- `createApplicantNote(applicantId, body)`
- `updateApplicantNote(noteId, body)`
- `deleteApplicantNote(noteId)`

### Templates

File: `src/server/services/templates.ts`

- `createTemplate()`
- `updateTemplate(id, formData)`
- `duplicateTemplate(id)`
- `deleteTemplate(id)`

Templates are copied into jobs at creation time. Existing jobs are not linked live to template changes.

### Settings

File: `src/server/services/settings.ts`

- `updateMyProfile(formData)`
- `updateOrganizationSettings(formData)`
- `updateTeamMemberRole(formData)`

### Public Application Submit

Files:

- `src/server/services/submit-job-application.ts`
- `src/server/services/submit-job-application-impl.ts`

Flow:

1. Validate `FormData` with Zod.
2. Upload resume.
3. Create applicant.
4. Enqueue `resume.parse`.
5. Send confirmation email.

## API Parity Checklist

| Capability | Current Surface | REST Parity Needed | Priority |
|---|---|---|---|
| Create/update/delete jobs | Server Actions | Yes: authenticated job command endpoints | P1 |
| Publish/close/archive jobs | Server Actions/service logic | Yes: explicit status endpoints or job update command | P1 |
| Custom job form fields | REST read + write (`POST .../form`) + Server Action | Done: authenticated write endpoint with `customFieldsSchema` validation | Done |
| Pipeline stage CRUD/reorder | Server Actions | Yes: stage create/update/delete/reorder endpoints | P1 |
| Move applicant | REST (`POST .../move`) + Server Action | Done: audited move endpoint creates `StageTransition` + dispatches webhooks/integration | Done |
| Applicant notes/interview date | Server Actions | Yes: note and applicant update endpoints | P1 |
| Parsed resume correction | Server Action | Yes: JSON/schema-safe correction endpoint | P1 |
| Parse retry | REST | Already REST exposed | Done |
| Applicant rescore | REST | Already REST exposed | Done |
| Applicant CSV export | REST | Already REST exposed | Done |
| Templates | Server Actions | Yes: CRUD/duplicate/preview endpoints | P1 |
| Integrations test/retry/delete | REST | Create/test/retry/delete mostly REST exposed | Partial |
| Organization/team settings | Server Actions | Yes: admin-only settings endpoints | P2 |

## Security Notes for API Work

- Every admin endpoint must call an auth/session helper and verify organization or job ownership.
- Middleware is a routing convenience, not the only security boundary.
- Every request body should be validated with Zod at the route/action boundary.
- Public endpoints need rate limits before production use.
- Webhook and integration endpoints intentionally send candidate data to configured external systems; logs and UI should mask bearer tokens and avoid raw secret exposure.

## Outbound Payloads

Organization webhook event:

```json
{
  "event": "applicant.status_changed",
  "timestamp": "2026-05-19T00:00:00.000Z",
  "data": {
    "applicantId": "app_id",
    "name": "Alex Doe",
    "email": "alex@example.com",
    "stageId": "stage_id",
    "stageName": "Interview",
    "status": "INTERVIEW",
    "jobTitle": "Senior Engineer"
  }
}
```

Per-stage integration event:

```json
{
  "event": "stage_transition",
  "timestamp": "2026-05-19T00:00:00.000Z",
  "candidate": {
    "id": "app_id",
    "name": "Alex Doe",
    "email": "alex@example.com",
    "phone": "+1 555 0100",
    "resumeUrl": "https://..."
  },
  "assessment": {
    "title": "Senior Engineer",
    "description": "Please answer each question concisely.",
    "questions": []
  }
}
```
