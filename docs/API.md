# ScoutLane HTTP API (selected routes)

This document summarizes the authenticated JSON routes used by the admin UI and automation-friendly flows. Admin routes expect a signed-in session cookie (Auth.js).

## Health

- `GET /api/health` — service liveness.

## Auth

- `GET/POST /api/auth/[...nextauth]` — Auth.js endpoints (Google OAuth + dev credentials).

## Public applications

- `POST /api/public/jobs/[slug]/applications` — JSON/Form alternative to the server action application submit (if enabled in your deployment).

## Admin: pipeline

- `GET /api/admin/jobs/[id]/pipeline` — returns pipeline stages with applicants grouped for the Kanban UI.

## Admin: job form

- `POST /api/admin/jobs/[id]/form` — persists custom application fields for a job.

## Admin: integrations

- `POST /api/admin/jobs/[id]/integrations` — creates a per-stage outbound integration (`stageId`, `endpointUrl`, `apiKey`, `includeQuestions`).
- `DELETE /api/admin/jobs/integrations/[integrationId]` — deletes an integration.
- `POST /api/admin/jobs/integrations/[integrationId]?action=test` — sends a **sample** `stage_transition` payload (includes assessment block when configured).
- `POST /api/admin/jobs/integrations/[integrationId]?action=retry` — replays the **last stored** `stage_transition` request body to the configured endpoint (admin-intentional retry).

## Admin: resume parsing retry

- `POST /api/admin/jobs/parse-retry/[applicantId]` — requeues resume parsing for an applicant (org-scoped).

## Admin: applicant export

- `GET /api/admin/jobs/[id]/applicants/export` — downloads a CSV of applicants for the job (auth required).

## Outbound integration contract (reference)

When an applicant enters a configured pipeline stage, the server sends:

```http
POST {endpointUrl}
Content-Type: application/json
Authorization: Bearer {configured_api_key}
```

Payload shape matches the take-home spec (`event`, `timestamp`, `candidate`, optional `assessment`).

## Notes

- Most writes also happen via Next.js Server Actions under `src/server/services/**` (not duplicated here).
- For a full inventory, search `src/app/api/**/route.ts`.
