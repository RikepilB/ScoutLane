# Assessment Progress and Gap Review

Last reviewed: 2026-05-28. (Detailed matrix below is from 2026-05-19; see "Take-Home Finish Scoreboard — 2026-05-28" immediately below for the current state.)

## Take-Home Finish Scoreboard — 2026-05-28

Goal IDs map to the take-home finish plan. Status reflects code in branch `feat/notifications-ai-parsing-hardening`.

| Goal | Item | Priority | Status |
|---|---|---|---|
| G1 | Restore `ASSESSMENT-PROGRESS.md` + `SECURITY-AUDIT.md`, whitelist + index | P0 | Done |
| G2 | Persist dropped job-create fields (slug, department, whatYouWillDo, requirements, toolsAndSkills) | P0 | Done — `create-impl.ts` + test |
| G3 | Resolve custom `file` field type (removed; resume upload is the only file mechanism) | P0 | Done — form builder, ApplicationForm, templates, schema |
| G4 | Persist `User` row on dev sign-in (ADMIN upsert + org) | P0 | Done — `sign-in.ts` + test |
| G5 | Production Google OAuth (GCP client + Vercel envs) | P0 | Open — user manual (GCP + Vercel) |
| G6 | Security audit evidence + per-IP rate limit | P0 | Done — `rate-limit.ts` + audit doc; advisory resolved (next bumped to 16.2.6) |
| G7 | Hosted deploy verified end-to-end (Vercel + Render workers + Resend) | P0 | Open — user manual |
| G8 | Codespaces cold-clone verify | P1 | Open |
| G9 | Extend e2e smoke (apply with fixture + applicants list/CSV) | P1 | Open |
| G10 | README + recorded demo + `v1.0.0-takehome` tag + prod PR | P0 | Open — user records demo |

**Corrections vs. the 2026-05-19 matrix below:** custom-field public submission (select options + required validation) was already shipped in `11c4521` — only the `file` type was a no-op (now removed, G3). Seed already includes AI Engineer template/job + ~200 applicants. `.devcontainer` and e2e smoke already exist.

Verification after the G2/G3/G4/G6 changes: `pnpm typecheck` clean, `pnpm lint` clean (1 pre-existing font warning), `pnpm test -- --run` 124 passing.

---


This document maps ScoutLane against the Full-Stack Developer Take-Home Assessment for the recruitment pipeline platform. It is written as a practical product/engineering progress update: what is done, what is in process or partial, and what remains missing before final submission.

## Executive Summary

ScoutLane has the core end-to-end path in place: authenticated admin, job creation, public job pages, configurable application forms, resume upload, asynchronous parsing, applicant review, pipeline stages, drag-and-drop movement, templates, outbound integrations, emails, CSV export, and job-scoped analytics.

The biggest remaining gaps are not the basic CRUD surfaces. They are polish, evaluation depth, and security evidence:

- Proving the product against the assessment's daily-use dashboard expectations.
- Tightening the applicant form custom-field behavior.
- Making template behavior exactly match the spec or explicitly documenting the chosen deviations.
- Hardening analytics, noindex/direct-link semantics, and API coverage.
- Producing security evidence for auth, uploads, public endpoint abuse, secrets, dependency risk, and integration logging.
- Running a clean-environment verification pass and a demo-oriented UX pass.

## Requirement Status

| Assessment Area | Status | Evidence | Remaining Gap |
|---|---|---|---|
| Public application portal | Done / partial | `/careers/[slug]`, `ApplicationForm`, noindex metadata, closed-job messaging | Current root has a public careers board, which conflicts with the "no centralized portal" wording but matches the recorded-demo request to browse careers listings. Decide and document final product stance. |
| Admin authentication | Done / updated 2026-08-28 | Clerk (invitation-only + guest demo), `INITIAL_ADMIN_EMAIL`, Prisma role sync, `clerkMiddleware` | Configure Clerk Dashboard invites + webhook; create guest user in Clerk for demo button. |
| Job management | Done / partial | Jobs list, multi-step create form, edit page, status actions, delete button | Slug uniqueness is handled by service logic, but final UX should make uniqueness/URL edit behavior obvious. |
| Job-scoped workspace | Done | `/admin/jobs/[id]` overview, tabs for pipeline/stages/form/applicants/integrations | Admin landing page is global first, then job scoped. That is acceptable but should be explained in demo. |
| Custom form builder | Partial | `/admin/jobs/[id]/form`, field add/edit/remove/reorder, required toggle, text/textarea/select/file | Public select custom fields do not appear to render configured options; custom file fields are not uploaded as files in the same robust way as resume. Required custom fields need stronger validation. |
| Application submission | Done / partial | Multipart form Server Action, resume upload, duplicate email handling, confirmation state, email send | Success stays on page instead of redirecting to a dedicated applied page. That is acceptable if intentionally presented, but demo should show the confirmation clearly. |
| Resume parsing | Done / partial | `pg-boss` queue, `pnpm worker:resume`, text extraction, OpenRouter parsing, confidence fields, retry endpoint/button | Parser quality needs validation against varied resumes. Low-confidence/missing fields are stored but UI could surface confidence more explicitly. |
| Manual correction of parsed data | Done | Applicant resume JSON editor exists in applicant detail | UX is developer/admin oriented; not yet a polished structured editor for hiring managers. |
| Original resume access | Done | Embedded resume viewer and new-tab fallback in applicant detail | Verify DOC/DOCX preview path; PDF is stronger than non-PDF preview. |
| Applicant list search/filter/sort/group | Done / partial | Search parsed JSON, filters for stage/institution/degree/skills/date, grouping, sort, pagination, CSV export | Some filters run in memory after fetch; acceptable for take-home scale but should be called out as a scaling tradeoff. |
| Job analytics | Partial | Job overview metrics, application trend, stage distribution, top institutions, top fields | Missing conversion rates, time-in-stage, time-to-hire, richer date range controls, and export/share of analytics. |
| Pipeline configuration | Done | Stage add/rename/reorder/delete with reassignment, per-job stages | Validate stage delete UX in demo with applicants assigned. |
| Pipeline board | Done / partial | Kanban columns, cards, drag/drop, refresh, move action | Confirm card shows time in current stage in compact required form (`1h`, `3d`, etc.) and enough parsed detail. |
| Stage transition logging | Done | `StageTransition`, applicant timeline, changedBy support | Confirm user name/timestamp rendering in applicant detail during demo. |
| Templates | Done / partial | Template CRUD, duplicate, preview, markdown upload, custom fields, questions, snapshot into jobs | Template editor still includes pipeline stages, while the assessment says templates should bundle custom fields and assessment questions, not pipeline stages. Decide whether to remove or document as an extension. |
| Assessment questions | Done / partial | Template questions copied to job and sent through integrations when enabled | Check default-new-template behavior: assessment requires 4 questions by default and at least 1 question for usable templates. |
| External integrations | Done / partial | Per-stage integrations, bearer token, include questions toggle, logs, test/retry, idempotency via `stageTransitionId` | Need demo with webhook.site showing headers/payload and both assessment included/excluded cases. |
| Applicant notification email | Done / partial | Resend integration, confirmation email, `EmailLog` | Verify real delivery in deployed/staging environment. |
| Error handling | Partial | Validation, duplicate application message, parse retry, integration logs, email log | File upload failures and custom field validation need demo-level confidence. |
| API-driven architecture | Partial | REST endpoints for key reads/actions plus Server Actions for most mutations | Assessment says every system action should be executable via API for agentic future. Many actions are Server Actions only, so document this as "callable server surface now, REST/API expansion remaining." |
| Security evidence | Partial | Auth.js, service-level session checks, Zod schemas, Prisma, GCS, Resend/OpenRouter env config, logs for email/integrations | Need documented audit evidence, upload hardening, rate limits, header policy, secret/dependency scans, and safe handling of candidate data in logs/exports/integrations. |
| Testing and QA | Partial | Vitest files, Playwright smoke config, e2e smoke suite | Need clean-environment test run, seeded 20-30 applicant QA, email and webhook verification. |
| Deployment deliverables | Partial | README, `.env.example`, docs, live URL references | Need final Codespaces verification and hosted deployment parity check. |

## Done

### Core Product Flow

- Admin can sign in and reach the dashboard.
- Admin can create jobs from scratch with title, description, structured sections, department, location, type, salary, slug, and status.
- Admin can create jobs from templates.
- Jobs have draft/active/closed derived status.
- Active jobs have public pages at `/careers/[slug]`.
- Candidates can submit application data and a resume.
- Duplicate applications are rejected per job/email.
- Applicants appear in job-scoped applicant and pipeline views.
- Resume parsing runs asynchronously through pg-boss.
- Admin can retry failed parsing.
- Admin can view original resume and parsed data.
- Admin can move applicants through job-specific stages.
- Stage transitions are logged.
- Confirmation email flow exists through Resend.

### Admin and Data Exploration

- Job overview contains job-scoped applicant metrics and charts.
- Applicant list supports search, filtering, sorting, grouping, pagination, and CSV export.
- Pipeline board supports drag-and-drop.
- Stages are configurable per job.
- Applicant detail includes parsed data, resume preview, notes, activity/timeline, interview date, rescore, and retry actions.

### Templates and Integrations

- Templates support reusable job defaults, markdown descriptions, structured sections, custom fields, and assessment questions.
- Template application uses a snapshot model.
- Integrations are configured per job/stage.
- Stage transitions can trigger outbound HTTP POSTs.
- Integration logs, test, retry, and failure counts exist.

## In Process / Partial

### UI/UX Flow

- The dashboard is functional and data-rich, but still needs a final product pass for information density, empty/loading states, and "daily tool" polish.
- The job creation wizard is clear, but template application and post-create next steps could be more guided.
- The public application page is professional, but the central careers board versus "direct-link only" requirement needs a final decision.
- Applicant detail is powerful but leans technical where parsed JSON editing is exposed.

### Forms

- Job-level custom fields can be configured and reordered.
- Template-level custom fields can be copied into jobs.
- Public rendering exists, but select options and custom file fields need stronger implementation/QA.
- Required custom field validation should be enforced at submit time.

### Analytics

- Counts and distributions are implemented.
- Required advanced metrics are still partial: conversion rates, time in stage, time to hire, richer date filtering, and analytics export/share.

### API Surface

- Several key actions are exposed through REST routes.
- Most admin mutations use Server Actions, which are callable application surfaces but not a complete public REST API for every system action.
- For the assessment's "agentic future" wording, the gap is a documented API layer over all major actions.

## Missing Gaps

### Must Fix or Explicitly Document Before Submission

1. P0 - Decide public portal stance.
   - Assessment says no centralized portal and direct links only.
   - Demo requirements mention browsing the careers listing page.
   - Current app has a careers board at `/`.
   - Recommendation: keep the board for demo, document it as a demo/discovery surface, and keep individual job pages noindexed.

2. P0 - Fix or document template pipeline behavior.
   - Assessment says templates bundle custom form fields and assessment questions.
   - Current templates also contain `stageNames`.
   - Recommendation: either remove stage names from templates or document it as an intentional extension. If optimizing for spec alignment, move stage configuration fully to job-level defaults.

3. P0 - Strengthen custom field public submission.
   - Render dropdown options from configured custom fields.
   - Enforce required custom fields.
   - Decide whether custom file fields are supported in MVP or disabled until robust upload exists.

4. P0 - Validate resume parsing quality.
   - Test multiple PDF/DOC/DOCX resumes.
   - Capture parsing success/failure examples.
   - Confirm low confidence/missing data is clearly visible.

5. P0 - Complete final demo path.
   - Seed multiple jobs and at least 20-30 applicants.
   - Show email delivery.
   - Show webhook.site integration with assessment payload.
   - Show CSV export.
   - Show pipeline config with different jobs having different stages.

6. P0 - Produce security proof for evaluator confidence.
   - Confirm production auth cannot expose the dev credentials provider.
   - Run secret and dependency scans or document why they were not available.
   - Verify admin routes/actions enforce auth and organization ownership beyond middleware.
   - Verify resume uploads have a clear max-size/type policy and safe error behavior.
   - Verify candidate data is not leaked through logs, integration secrets, public pages, or exports.

### Important Product Gaps

- Conversion-rate and time-in-stage analytics.
- Keyboard shortcuts are not implemented.
- Dashboard responsiveness needs final manual QA on mobile/tablet.
- Job analytics are job-scoped, but the admin landing dashboard still shows global metrics; demo should explain the transition from global overview to job workspace.
- No dedicated analytics export beyond applicant CSV.
- No true invite flow for admin users; team role management exists after users are present.
- No dedicated centralized observability provider.

### Engineering Gaps

- Full API parity for all actions remains incomplete.
- Upload hardening, public rate limiting, and security headers need implementation evidence.
- Dependency, secret, SAST, and DAST checks are planned but not yet captured as passing evidence.
- Some filtering/sorting is in-memory after database fetch and should be moved database-side for scale.
- External worker deployment must be configured separately from Vercel.
- Clean Codespaces/new-clone verification is still required.
- Playwright smoke coverage should be aligned with the final recorded demo path.

## Prioritized Finish Plan

| Priority | Workstream | Completion Criteria |
|---|---|---|
| P0 | Custom field public submission | Dropdown options render, required fields are enforced, custom file behavior is either implemented or disabled with clear copy. |
| P0 | Auth/security proof | Production auth config verified, dev login unavailable, admin route/action ownership checks audited. |
| P0 | Security docs | `SECURITY-AUDIT.md` is linked and updated with evidence. |
| P0 | Demo data and path | 2+ jobs, 20-30 applicants, parsing states, integration logs, CSV export, and final demo script are ready. |
| P1 | API parity | REST endpoints exist or are ticketed for every major Server Action workflow. |
| P1 | Analytics depth | Conversion rate, time-in-stage, time-to-hire, and date range controls are implemented or documented as roadmap. |
| P1 | Upload/rate-limit hardening | File limits/types, public endpoint rate limits, and abuse tests exist. |
| P2 | Hiring-manager polish | Structured parsed-data editor, clearer confidence UI, richer empty/loading states, keyboard shortcuts. |

## Flow Review

### Best Current Flow for Demo

1. Sign in as admin.
2. Create or open a template.
3. Show template custom fields and assessment questions.
4. Create a job from the template.
5. Edit job-level custom fields.
6. Publish the job.
7. Open public job page.
8. Submit an application with resume.
9. Show applicant in list with parsing status.
10. Run or wait for worker parsing.
11. Open applicant detail: resume, parsed data, notes, timeline.
12. Move applicant in pipeline.
13. Show integration log and webhook receiver.
14. Show job overview analytics and CSV export.

### Flow Friction to Improve

- After job creation, redirecting to the job detail instead of the jobs list would make setup continuation smoother.
- The template-to-job path should make copied fields/questions obvious.
- Application success could link to a simple applied/status page for candidate reassurance.
- Applicant detail should show confidence and missing fields in a hiring-manager-friendly way.
- Integration logs should be easy to interpret during demo without reading raw JSON first.

## UI/UX Readiness

| Surface | Readiness | Notes |
|---|---|---|
| Public job page | Good | Professional, responsive structure, noindex metadata. Needs custom field QA. |
| Public careers board | Good but product-decision dependent | Useful for demo; conflicts with direct-link-only wording if treated as production behavior. |
| Admin dashboard landing | Partial | Useful global snapshot, but assessment emphasizes selecting a job then working inside job scope. |
| Job overview | Good | Strongest assessment fit for job-scoped analytics. Missing advanced metrics. |
| Applicant list | Good | Dense and useful. Needs performance/scaling note. |
| Applicant detail | Good / partial | Feature-rich, but parsed-data editing can feel technical. |
| Pipeline | Good | Core Kanban flow exists. Need compact time-in-stage verification. |
| Templates | Partial | Powerful but needs spec alignment around pipeline stages and question defaults. |
| Integrations | Good / partial | Core reliability patterns exist. Needs demo verification against webhook.site. |

## Recommended Next Work

1. Run the full demo flow manually and write down every broken/awkward moment.
2. Fix custom field select options and required validation.
3. Decide whether to keep template stage names.
4. Improve or document public board versus direct-link-only semantics.
5. Seed realistic data and verify analytics are meaningful.
6. Run clean-environment verification:

```bash
pnpm lint
pnpm typecheck
pnpm test -- --run
pnpm build
pnpm test:e2e
```

7. Record a final 10-15 minute demo around the assessment deliverables.

## Submission Positioning

ScoutLane should be presented as a strong, nearly complete take-home with a real end-to-end workflow and thoughtful architecture. The honest remaining story is:

- The core product works.
- The app has a credible async parsing and integration architecture.
- The biggest missing pieces are final UX polish, richer analytics, complete API parity, and clean-environment proof.
