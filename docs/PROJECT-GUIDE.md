# ScoutLane Project Guide

Last reviewed: 2026-05-19.

## Overview

ScoutLane is an AI-assisted recruitment platform with:

- A public careers portal for browsing and applying to jobs.
- An admin dashboard for jobs, applicants, templates, settings, and pipeline management.
- Durable resume parsing through a background worker.
- AI-generated structured resume data and match scoring.
- Custom forms, templates, applicant notes, CSV export, webhooks, and per-stage integrations.

## Personas

| Persona | Goal |
|---|---|
| Candidate | Find a job, submit an application, receive confirmation. |
| Recruiter | Review applicants, search/filter, move applicants through the pipeline. |
| Hiring Manager | See job progress and candidate quality quickly. |
| Admin | Configure jobs, templates, organization settings, team roles, and integrations. |

## Core User Flows

Candidate apply:

```text
Home careers board -> Job detail -> Apply form -> Resume upload -> Confirmation -> Async parse/score
```

Admin job management:

```text
Sign in -> Jobs -> Create/edit job -> Publish -> Public page visible
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

Implemented or present in repo:

- Public careers board with search/filter/grouping UI.
- Public job detail and multipart application form.
- Job alerts endpoint/model.
- Auth.js Google OAuth and dev login.
- Role-gated admin area.
- Dashboard stats and charts.
- Job CRUD and status mapping.
- Multi-step job creation form.
- Pipeline stages and Kanban drag/drop.
- Stage transition audit trail.
- Applicant list, applicant detail, resume preview, notes, interview date.
- Resume text extraction from PDF/DOC/DOCX paths.
- OpenRouter-based resume parsing.
- Applicant match scoring.
- pg-boss resume parse queue and worker.
- Confirmation email through Resend and `EmailLog`.
- Job templates with markdown descriptions, structured questions, custom fields, and snapshot behavior.
- Per-job custom application forms.
- Per-stage integrations and organization-wide webhooks.
- CSV applicant export.
- Settings for organization/profile/team roles.
- Vitest and Playwright test coverage.

Known gaps or finish-line items:

- Worker deployment must be configured outside Vercel.
- Monitoring is still lightweight; no dedicated error tracking provider is wired.
- E2E smoke coverage exists but should be kept aligned with the final product path.
- API response shapes are not fully standardized.
- Full production verification should run from a clean non-OneDrive environment if local `EPERM` appears.

## Admin Manual

### Sign In

Use `/signin`.

- Development: type any email; the dev provider returns an `ADMIN` session.
- Production: configure Google OAuth and `INITIAL_ADMIN_EMAIL`.

### Jobs

Use `/admin/jobs` to create, edit, publish, archive, close, or delete jobs. Active jobs appear on the public careers board and `/careers/[slug]`.

### Pipeline

Use `/admin/jobs/[id]/pipeline` to drag applicants between stages. Moves update the applicant stage/status, log a transition, and may fire integrations.

### Applicants

Use `/admin/jobs/[id]/applicants` to search, filter, sort, group, and export. Applicant detail includes resume preview, parsed data, scoring, status controls, interview date, timeline, and notes.

### Templates

Use `/admin/templates` to manage reusable job structures. Applying a template copies its values into a job; later template edits do not mutate existing jobs.

### Integrations

Use `/admin/jobs/[id]/integrations` to configure outbound calls when candidates enter a specific pipeline stage. Use logs and retry/test actions to verify delivery.

### Settings

Use `/admin/settings` for profile, organization, and team role changes. Organization and team changes are admin-only.

## Demo Plan

Target demo length: 5 minutes.

1. Public careers board: search and open a role.
2. Candidate application: fill form, upload resume, submit.
3. Admin dashboard: sign in, show stats.
4. Jobs and templates: create a job from a template.
5. Pipeline: move the submitted applicant to Interview.
6. Applicant detail: show resume preview, parsed data, score, notes.
7. Integrations: show stage integration logs.
8. Finish with worker/queue explanation: parsing is async and durable.
