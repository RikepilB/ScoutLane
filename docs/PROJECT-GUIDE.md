# ScoutLane Project Guide

Last reviewed: 2026-08-28.

> **Canonical feature list:** [`PRODUCT-SPEC.md`](./PRODUCT-SPEC.md)

## Overview

ScoutLane is an AI-assisted recruitment platform with:

- A public careers portal for browsing and applying to jobs.
- An admin workspace for jobs, applicants, templates, settings, and pipeline management.
- Durable resume parsing through pg-boss (or inline on Vercel).
- AI-generated structured resume data and job-fit scoring.
- Custom forms, templates, applicant notes, CSV export, webhooks, and per-stage integrations.
- **Clerk** authentication with invitation-only sign-up and a guest demo path.

## Personas

| Persona | Goal | Access |
|---------|------|--------|
| Candidate | Find a job, submit an application, receive confirmation | Public — no account |
| Recruiter | Review applicants, search/filter, move pipeline | Clerk invite → `RECRUITER` |
| Hiring Manager | See job progress and candidate quality | Clerk invite → `HIRING_MANAGER` |
| Admin | Configure jobs, templates, org, team roles, integrations | Clerk invite or `INITIAL_ADMIN_EMAIL` → `ADMIN` |
| Guest (demo) | View admin UI without changing data | **Continue as Guest** → `GUEST` |

## Core User Flows

Candidate apply:

```text
Home careers board -> Job detail -> Apply form -> Resume upload -> Confirmation -> Async parse/score
```

Admin job management:

```text
Sign in -> Jobs -> Create/edit job -> Publish -> Visible on board + /careers/[slug]
```

Pipeline management:

```text
Job detail -> Pipeline -> Drag applicant -> Transition logged -> Webhooks/integrations fire
```

Applicant review:

```text
Applicants list -> Search/filter/group/sort -> Detail -> Resume preview -> Parsed data -> Notes/interview date/status
```

Template use:

```text
Templates -> Create/edit template -> New job from template -> Snapshot copied into job
```

## Feature Inventory

Implemented in repo (see [`PRODUCT-SPEC.md`](./PRODUCT-SPEC.md) for routes and roles):

- Public careers board with search/filter UI.
- Public job detail and multipart application form.
- Job alerts endpoint/model.
- **Clerk auth** — invitation-only sign-up, Google/email via Clerk Dashboard, guest demo, webhook user sync.
- Four workspace roles with middleware + service-layer enforcement.
- Dashboard stats and charts.
- Job CRUD and derived draft/active/closed status.
- Multi-step job creation form.
- Pipeline stages and Kanban drag/drop.
- Stage transition audit trail.
- Applicant list, detail, resume preview, notes, interview date.
- Resume text extraction (PDF/DOC/DOCX/TXT/CSV).
- OpenRouter-based resume parsing and match scoring.
- pg-boss resume parse queue and email worker.
- Confirmation email through Resend and `EmailLog`.
- Job templates with snapshot behavior.
- Per-job custom application forms.
- Per-stage integrations and organization-wide webhooks.
- CSV applicant export.
- Settings for organization/profile/team roles.
- Vitest and Playwright test coverage.

Known gaps — see [`GAPS.md`](../GAPS.md):

- Worker deployment outside Vercel for durable queues.
- Lightweight monitoring (no Sentry/etc. wired).
- Partial REST API parity (many mutations are Server Actions).
- Advanced analytics (conversion, time-to-hire) incomplete.

## Admin Manual

### Sign In

Use `/signin` to choose a workspace. Demo users:

| Path | When | Demo user |
|------|------|-----------|
| `/signin?as=admin` | Enter as Admin (full workspace) | `admin@scoutlane.local` |
| `/signin?as=recruiter` | Enter as Recruiter (jobs + applicants) | `recruiter@scoutlane.local` |
| **Clerk invite** | Production — invitation-only in Clerk Dashboard | Your invited email |
| **Continue as Guest** | Read-only tour | `guest@scoutlane.local` |
| **First admin** | Set `INITIAL_ADMIN_EMAIL`; that email gets `ADMIN` on first Clerk sign-in | Your configured email |

Clerk env: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SECRET`.

### Jobs

Use `/admin/jobs` to create, edit, publish, archive, close, or delete jobs. Active jobs appear on `/jobs` (careers board) and `/careers/[slug]` (apply flow).

### Pipeline

Use `/admin/jobs/[id]/pipeline` to drag applicants between stages. Moves update stage/status, log a transition, and may fire integrations.

### Applicants

Use `/admin/jobs/[id]/applicants` to search, filter, sort, group, and export. Detail view: resume preview, parsed data, scoring, status, timeline, notes.

### Templates

Use `/admin/templates`. Applying a template **copies** into the job; later template edits do not mutate existing jobs.

### Integrations

Use `/admin/jobs/[id]/integrations` for per-stage outbound POSTs. Use logs and retry/test actions to verify delivery.

### Settings

Use `/admin/settings` for profile (all roles), organization and team roles (admin only).

## Demo Plan

Target: 10 minutes for a hiring manager audience. Full script in [`PRODUCT-SPEC.md` §8](./PRODUCT-SPEC.md#8-demo-script-10-minutes).

1. Home `/` → harness demo + Enter as Admin or Recruiter.
2. Dashboard stats.
3. Job detail with candidates pipeline.
4. Applicant review (parsed resume data + scoring).
5. Create job from template → publish to `/jobs`.
6. Candidate side: browse `/jobs` and apply.
7. Integration log (webhook.site).
8. CSV export applicants.
