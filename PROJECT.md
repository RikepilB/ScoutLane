# ScoutLane — Project Overview

> The narrative a senior engineer would give a new hire. Operational rules live in
> `.claude/CLAUDE.md`; the honest weakness audit lives in `GAPS.md`. When this file
> disagrees with code, trust the code and fix this file in the same change.

Last full audit: 2026-07-07 (deep knowledge-transfer pass over the entire codebase).

---

## 1. What this is

ScoutLane is a **hiring / applicant-tracking system (ATS)** built as a full-stack
take-home project that has since been hardened toward production. One deployable
Next.js app serves two audiences:

- **Candidates (public, no account):** browse a careers board (`/`), open a job page
  (`/careers/<slug>`), fill an application form, upload a resume. They get a
  confirmation email. That's their entire surface.
- **Recruiting teams (authenticated):** everything under `/admin` — dashboard with
  charts, job CRUD, a drag-and-drop Kanban pipeline, applicant search/filter/export,
  AI-parsed resume data, reusable job templates, per-stage outbound integrations,
  email notifications, and org/team settings.

The differentiating feature is **AI resume parsing**: uploaded resumes are text-extracted
(PDF/DOCX/TXT/CSV), sent to an LLM via OpenRouter, and the structured result (education,
work history, skills, plus a 0–1 job-fit score) is stored on the applicant and powers
search, filters, and the applicant detail view.

It is deployed on Vercel (`scoutlane.vercel.app`), single organization in practice, but
the data model and most queries are multi-tenant (org-scoped) by design.

## 2. Tech stack and why

| Piece | Choice | Why (inferred from code/docs) |
|---|---|---|
| Framework | Next.js 16, App Router, React 19 | One deployable for public site + admin app + API; RSC lets admin pages call services directly with no fetch hop. Dev uses Turbopack (`next dev --turbo`), prod build forces webpack (`next build --webpack`). |
| Language | TypeScript 6 (strict) | Non-negotiable baseline. |
| DB | PostgreSQL + Prisma 7 | Prisma client generated to `src/generated/prisma/` (custom output), driven through `@prisma/adapter-pg` over a `pg.Pool` — the JS driver adapter, **not** the Rust engine. Chosen for Vercel compatibility and one fewer binary. |
| Auth | NextAuth v5 beta (Auth.js), **JWT strategy** | JWT (not DB sessions) keeps middleware Edge-safe — the middleware can verify a session without Prisma. PrismaAdapter is still attached in `auth.ts` for user/account persistence. |
| Background jobs | pg-boss 12 | Queue lives inside the existing Postgres — no extra infra. Two queues: `resume.parse`, `email.send`. Workers are long-running processes (`pnpm worker:resume`, `pnpm worker:emails`) that cannot run on Vercel serverless; on Vercel the code falls back to inline execution via `next/server`'s `after()` (see §4, job runner). |
| AI | OpenRouter through the `openai` SDK | Provider-agnostic model access with a fallback-model chain and a free default model (`deepseek/deepseek-chat-v3.1:free`). 20s timeout, JSON-mode-then-plain retry. |
| Storage | GCS → S3-compatible → Postgres BLOB → local disk | Three-tier fallback in `src/lib/storage/upload.ts` so resume upload works in any environment without config: GCS if configured, hand-rolled SigV4 S3 if configured, `ResumeFile` table (Bytes column) on Vercel/prod, `.data/resumes/` locally. |
| Email | Resend | Simple transactional API; every send outcome is logged to the `EmailLog` table. |
| UI | Tailwind v4 + shadcn/ui + Radix, dnd-kit, Recharts, sonner, react-hook-form + Zod 4 | Standard shadcn stack; dnd-kit powers the Kanban board; Zod schemas in `src/schemas/` are shared by client forms and server validation. |
| Tests | Vitest (jsdom) + Playwright | ~32 vitest files colocated as `*.test.ts(x)`; one Playwright smoke suite (`tests/e2e/smoke.spec.ts`, 8 tests, desktop + mobile Chromium). |

## 3. Architecture

**Pattern: modular monolith.** One Next.js app, one Postgres DB, domain modules that
all talk to the same Prisma client. No network boundaries between modules.

```
                       ┌────────────────────────────────────────────┐
 Candidate ──────────► │  Next.js App Router                        │
   /  /careers/[slug]  │                                            │
                       │  (public) pages ─► Server Action           │
                       │        submitJobApplication ──┐            │
 Recruiter ──────────► │  (admin) pages (RSC) ─► src/server/services│──► Prisma ──► PostgreSQL
   /admin/*            │  api/admin/* routes  ─► services (thin)    │      ▲            │
                       │  middleware.ts (JWT role gate, Edge)       │      │       pg-boss tables
                       └───────────────┬────────────────────────────┘      │            │
                                       │ upload            enqueue/inline  │            ▼
                                       ▼                                   │   workers/resume.ts
                              lib/storage (GCS→S3→DB→disk)                 │   workers/emails.ts
                                                                           │      │        │
                              lib/llm (OpenRouter) ◄───────────────────────┘◄─────┘        ▼
                              lib/email (Resend) ◄─────────────────────────────────── Resend API
                              lib/webhook + JobIntegration POST ──► customer endpoints
```

### Layers, from outside in

1. **`src/middleware.ts`** (Edge) — coarse gate. Public allowlist (`/`, `/signin`,
   `/access-denied`, `/api/health`, `/careers/**`, `/api/public/**`, `/api/resumes/**`,
   static files); everything else requires a session; `/admin/*` and `/api/admin/*`
   additionally require role ∈ {ADMIN, RECRUITER, HIRING_MANAGER}. It uses
   `auth.config.ts` only (no Prisma — Edge-safe). **Middleware is convenience, not the
   security boundary** — every route handler and service re-checks session + org.

2. **Pages** — Server Components by default. Admin pages call services or Prisma
   directly (no fetch-to-self). Client Components (`"use client"`) only where needed:
   forms, the Kanban board, the form builder, charts. Page-local components live in
   sibling `_components/` folders; page-local helpers in `_lib/`.

3. **API routes** (`src/app/api/**/route.ts`, 14 handlers) — thin; validate with Zod,
   delegate to a service. Only a subset of operations is REST (pipeline read, applicant
   move, form save, integrations CRUD, parse-retry, rescore, CSV export, public
   application submit, job alerts, resume serving). **Most admin mutations are Server
   Actions, not REST** — this "API parity gap" is documented in `docs/API.md`.

4. **Services** (`src/server/services/`) — the business logic. Organized by domain
   (`applicants/`, `jobs/`, `pipeline/`, `emails/`, plus loose `templates.ts`,
   `settings.ts`, `job-alerts.ts`, `current-user.ts`). Pervasive pattern: a thin
   `"use server"` action file dynamically imports a sibling `*-impl.ts` where the
   testable logic lives. Auth inside services uses `requireSession()`
   (`_lib/validate-session.ts`) which throws unless there is a session **and** an
   organizationId; every query is then org-scoped.

5. **Infrastructure clients** (`src/lib/`) — auth, db (Prisma singleton), email,
   storage, llm, resume (extraction/parsing/access-control), webhook, rate-limit,
   slug, jobs (status derivation), match (LLM scoring). Never imported from client
   components; barrel `index.ts` per module.

6. **Queues/workers** (`src/server/queues|workers|jobs/`) — pg-boss producers, worker
   entrypoints, and a **job-runner abstraction** (`server/jobs/runner.ts` +
   `dispatch.ts`): mode `worker` enqueues to pg-boss (needs a running worker process),
   mode `inline` executes after the HTTP response via `after()`. Default: `inline` on
   Vercel, `worker` elsewhere; override with `JOB_RUNNER` / `RESUME_PARSE_MODE`.

### The data model in one paragraph

`Organization` owns `User`s, `Job`s, and `JobTemplate`s. A `Job` has ordered
`PipelineStage`s (user-named, per-job) and `Applicant`s. An applicant points at a
stage (`pipelineStageId`) and also carries a denormalized `status`
(`ApplicationStatus` enum) derived from the stage's *name* at move time
(`pipeline/update-impl.ts:deriveStatus` — unmapped names silently become
`REVIEWING`). Every move writes a `StageTransition` and may fire two outbound
mechanisms: global `Webhook`s (HMAC-signed, logged to `WebhookLog`) and per-stage
`JobIntegration`s (bearer-token POST, logged to `IntegrationLog`, idempotent per
transition). Resume binaries can live in `ResumeFile` (DB BLOB). `EmailLog` records
every email attempt. `JobAlert` holds public email subscriptions. `Session` /
`VerificationToken` exist for the NextAuth adapter but are effectively unused at
runtime because sessions are JWT.

### Key flows

**Public application (the money path):**
`ApplicationForm` (client) → `submitJobApplication` Server Action (multipart,
rate-limited 10/min/IP) → `submit-job-application-impl.ts`: Zod-validate → upload
resume via storage fallback chain → create `Applicant` (`@@unique([jobId, email])`
gives friendly duplicate handling) → dispatch resume parse (queue or inline) →
dispatch confirmation + admin-notification emails (queued or inline, paced 300ms
apart for Resend's rate cap). A JSON twin exists at
`POST /api/public/jobs/[slug]/applications` but rejects file uploads (`resumeUrl`
not accepted) — the form action is the real path.

**Resume parsing:** worker or inline → `parseApplicantResume.ts`: read bytes
(storage-read has path-traversal guards) → `extractText.ts` (pdfjs with
`@napi-rs/canvas` polyfills preloaded so it works on Vercel; mammoth for DOCX) →
`lib/llm/resume.ts` LLM structured extraction (Zod-validated, confidence fields) →
`lib/match/scoreApplicant.ts` job-fit score → persist `parsedData`, `score`,
`parsingStatus`. Failures mark `FAILED` and rethrow so pg-boss retries (limit 3).
Admin can retry (`/api/admin/jobs/parse-retry/[applicantId]`, `?mode=inline` forces
synchronous) or rescore.

**Pipeline move:** Kanban drag → `moveApplicant` action → `moveApplicantImpl`:
org/job ownership checks → update stage + derived status → `StageTransition` →
webhooks + per-stage integration POST (with per-transition idempotency via
`IntegrationLog` lookup) → `revalidatePath`.

**Auth/onboarding:** Google OAuth (or dev credentials provider — see gotchas) →
`handleSignIn` upserts the user, attaches the first existing org (creates one only
on an empty DB), promotes `INITIAL_ADMIN_EMAIL` to ADMIN, optionally gates by
`AUTH_ALLOWED_EMAIL_DOMAIN`; `auth.ts`'s jwt callback re-reads role/userId from DB
on each token refresh, so DB role changes propagate to live JWT sessions.

## 4. Design decisions worth knowing

- **JWT sessions, deliberately.** README/AGENTS historically said "database sessions";
  the config is `strategy: "jwt"`. The reason is the Edge middleware: it can check
  roles without a DB round-trip. Consequence: the `Session` table is dead weight.
- **`auth.config.ts` vs `auth.ts` split.** `auth.config.ts` is Edge-safe (no Prisma) and
  is all middleware sees; `auth.ts` layers PrismaAdapter + DB-backed callbacks on top.
  Never import `auth.ts` (or anything that pulls Prisma) into middleware.
- **Thin action → `*-impl.ts`.** Keeps `"use server"` modules light (dynamic import of
  heavy deps) and makes logic unit-testable without the server-action runtime.
- **Snapshot templates.** Applying a `JobTemplate` **copies** fields/stages/questions
  onto the Job at creation. Editing a template later must NOT affect existing jobs.
  Same idea for `Job.assessmentQuestions` (snapshot used in integration payloads).
- **Derived job status.** Draft/active/closed is computed from `published`+`archived`
  (`src/lib/jobs/status.ts`) — never stored as a column. Don't add one.
- **Storage fallback chain** (GCS → S3 → DB BLOB → disk) so the app works with zero
  storage config anywhere. The DB-BLOB tier is why `ResumeFile` exists.
- **Job-runner duality.** Every async task has two execution modes (pg-boss worker vs
  inline `after()`), selected by environment. This is the single most confusing part
  of the codebase — read `src/server/jobs/runner.ts` + `dispatch.ts` before touching
  anything async.
- **Defense-in-depth org scoping.** 404 (not 403) for cross-org resume access so
  existence isn't leaked (`src/lib/resume/access.ts`). Services re-check ownership
  even when a route already did.
- **Additive migrations only.** 15 migrations in `prisma/migrations/`; never edit a
  pushed one.
- **CI** (`.github/workflows/ci.yml`): lint → typecheck → vitest → build, with a real
  Postgres service for the build step and migration deploy only on `master`.
  Playwright is NOT in CI.

## 5. Critical paths (be careful) vs safe to change

**Load-bearing — test before and after, think about prod:**
- `src/server/services/submit-job-application-impl.ts` — the public money path.
- `src/server/services/pipeline/update-impl.ts` — stage moves + status derivation +
  webhook/integration dispatch (idempotency logic lives here).
- `src/lib/auth/*` + `src/middleware.ts` — auth; subtle Edge constraints.
- `src/lib/storage/upload.ts` + `src/lib/resume/storage-read.ts` — fallback chain +
  path-traversal guards; both prod (Vercel BLOB) and local behavior.
- `src/lib/resume/extractText.ts` — the pdfjs/canvas polyfill dance exists because
  parsing silently broke on Vercel twice (#93, #96). Don't "clean it up".
- `src/server/jobs/runner.ts` / `dispatch.ts` — inline-vs-worker selection.
- `prisma/schema.prisma` — additive-only migrations.
- `src/lib/resume/access.ts` — PII gate for resume files (was a real leak, fixed in PR #108).

**Safe to change casually:**
- Admin UI components under `src/components/` and page `_components/` folders (well
  covered by recent split refactors; no hidden coupling).
- `docs/*` (curated but drift-prone; update freely alongside code).
- `prisma/seed*.ts`, email HTML templates, dashboard charts.
- Copy/styling on public pages (but keep the noindex metadata in `(public)/layout.tsx`).

## 6. Surprises and traps for someone new

1. **Prisma client import path.** Always `@/generated/prisma/client` (or `/enums`).
   `src/generated/` is gitignored — after a fresh clone or when imports break, run
   `pnpm prisma:generate`.
2. **Dev login mints ADMIN for any email.** Credentials provider `"dev"` is enabled in
   `next dev` or when `ALLOW_DEV_LOGIN=1`. It upserts a real ADMIN user in your DB.
   Never set `ALLOW_DEV_LOGIN` in prod.
3. **The `(admin)/admin/` double nesting is intentional.** `(admin)` = layout/auth
   group, inner `admin/` = URL prefix. Flattening changes URLs and breaks middleware.
4. **Stage names drive status.** Renaming a pipeline stage silently changes which
   `ApplicationStatus` applicants get on their next move; unmapped names default to
   `REVIEWING` with no warning (`deriveStatus`).
5. **Two applicant-notes systems.** Legacy freeform `Applicant.notes` string AND
   structured `ApplicantNote` rows. Both are live. Check which one a UI reads before
   "fixing" it.
6. **Three auth-helper flavors.** `requireSession()` (throws, org guaranteed),
   `getCurrentUserWithOrganization()` (nullable, auto-creates a fallback org!), and an
   inline re-implementation in `jobs/create-impl.ts`. New code should use
   `requireSession()`.
7. **`pnpm test` watches by default.** CI-style single run is `pnpm test -- --run`.
8. **Playwright e2e needs a real `DATABASE_URL`.** With the placeholder `.env`, 4 of 8
   smoke tests fail (DB-dependent flows) — that's the known baseline, not a regression.
9. **Windows/OneDrive quirk.** The repo lives under OneDrive; paths contain spaces —
   quote them. Dependency binaries occasionally hit OneDrive locks.
10. **Docs lie in places.** Root `README.md` middleware/auth claims are stale, root
    `handoff.md` is an old fallback, `docs/CLAUDE.md` references a dead worktree, the
    old `docs/HANDOFF.md` is frozen at 2026-05-20. Live context = `docs/handoff/`
    tree (father `HANDOFF.md`) — which is local-only, not in git. Trust code > docs.
11. **`/[slug]` shortlink is auth-gated by accident** (not in the middleware public
    list) and **`/careers` has no page** despite being whitelisted — both are open
    gaps listed in `GAPS.md`.
12. **In-memory rate limiter.** Per-process fixed window; resets on cold start,
    doesn't coordinate across serverless instances. Fine for the take-home, not real
    protection.
