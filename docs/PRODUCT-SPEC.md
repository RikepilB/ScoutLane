# ScoutLane — Product Specification (Current)

Last updated: 2026-08-28.

This document describes **what ScoutLane is today** — for demos, recruiters, and onboarding.
The original take-home assessment draft is archived at
[`spec-v1-take-home-draft.md`](./archive/spec-v1-take-home-draft.md).

When this doc disagrees with code, trust the code and update this file in the same change.

---

## 1. Product summary

ScoutLane is an **AI-assisted applicant tracking system (ATS)** for recruiting teams.
One Next.js deployment serves:

| Audience | Surface | Auth |
|----------|---------|------|
| **Marketing** | `/` landing page + harness demo | None |
| **Candidates** | `/jobs` careers board, `/careers/[slug]` apply flow | None |
| **Recruiters** | `/admin/*` workspace (jobs, pipeline, applicants) | Clerk (invited) **or** `/signin?as=recruiter` (demo) |
| **Hiring managers** | `/admin/*` (trimmed nav — jobs + account) | Clerk (invited) |
| **Admins** | Full `/admin/*` + organization settings | Clerk (invited or `INITIAL_ADMIN_EMAIL`) **or** `/signin?as=admin` (demo) |
| **Guest demo** | `/admin/*` read-only | One-click guest sign-in |

**Live demo:** [scoutlane.vercel.app](https://scoutlane.vercel.app)

---

## 2. Core experience

```text
Admin creates job (+ optional template) → publishes → job on /jobs + /careers/[slug]
→ candidate applies (custom form + resume) → confirmation email
→ resume parsed async (LLM) → applicant in job pipeline
→ recruiter reviews, filters, moves stages → integrations/webhooks fire on transition
```

---

## 3. Feature inventory

### Public (candidates)

| Feature | Route / entry | Notes |
|---------|---------------|-------|
| Careers board | `/jobs` | Published jobs with search/filter UI |
| Landing page | `/` | Hero + harness demo + workspace entry doors |
| Job detail + apply | `/careers/[slug]` | Markdown description, custom form fields |
| Application submit | Server Action | Multipart upload, duplicate email rejected **per job** |
| Confirmation email | Resend | Logged in `EmailLog` |
| Job alerts | `POST /api/public/job-alerts` | Optional signup model |
| Closed / draft jobs | `/careers/[slug]` | Clear messaging when not accepting applications |

### Admin workspace

| Feature | Route | Roles |
|---------|-------|-------|
| Dashboard | `/admin` | All workspace roles |
| Jobs list + CRUD | `/admin/jobs` | Non-guest |
| Multi-step job create | `/admin/jobs/new` | Non-guest |
| Job overview + analytics | `/admin/jobs/[id]` | All (guest read-only) |
| Kanban pipeline | `/admin/jobs/[id]/pipeline` | Non-guest to move |
| Stage configuration | `/admin/jobs/[id]/stages` | Non-guest |
| Form builder | `/admin/jobs/[id]/form` | Non-guest |
| Applicants list | `/admin/jobs/[id]/applicants` | All; export non-guest |
| Applicant detail | `/admin/jobs/[id]/applicants/[applicantId]` | Resume, parsed JSON, notes, timeline |
| Per-job integrations | `/admin/jobs/[id]/integrations` | Non-guest |
| Global integrations index | `/admin/integrations` | Non-guest |
| Templates | `/admin/templates` | Non-guest |
| Notifications | `/admin/notifications` | Non-guest |
| Email templates | `/admin/email-templates` | Non-guest |
| Organization settings | `/admin/settings` | Admin for team/org; all for profile |

### Intelligence & automation

| Feature | Implementation |
|---------|----------------|
| Resume text extraction | PDF / DOCX / TXT / CSV (`src/lib/resume/extractText.ts`) |
| AI structured parse | OpenRouter LLM → education, work, skills, confidence |
| Job-fit score | 0–1 match score stored on applicant |
| Async parsing | pg-boss queue **or** inline `after()` on Vercel |
| Parse retry | Admin action + API route |
| Rescore | LLM re-run for match score |
| Stage transition log | `StageTransition` + applicant timeline |
| Org webhooks | HMAC-signed POST on status events |
| Per-stage integrations | Bearer POST with optional assessment payload |
| Integration logs | Success/failure, retry, test payload |

### Access control

| Role | Capabilities |
|------|--------------|
| `ADMIN` | Full settings, team role management, all mutations |
| `RECRUITER` | Jobs, pipeline, applicants (nav: dashboard, my jobs, account) |
| `HIRING_MANAGER` | Job-focused nav (my jobs, account) |
| `GUEST` | Read-only admin; banner + server-side `assertNotGuest` on mutations |

Roles live in **Postgres** (`User.role`). Clerk handles identity only; sync on sign-in via
`syncUserFromClerk()` and optional webhook.

---

## 4. Authentication (Clerk)

| Method | Who | How |
|--------|-----|-----|
| **Invitation** | Recruiters, admins | Clerk Dashboard → invite; sign-up restricted to invitations |
| **Google / email** | Invited users | Configured in Clerk Dashboard |
| **Guest demo** | Anyone | `/signin` → **Continue as Guest** → `guest@scoutlane.local` |
| **First admin** | Bootstrap | `INITIAL_ADMIN_EMAIL` promoted to `ADMIN` on first sync |

Env vars: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SECRET`,
`INITIAL_ADMIN_EMAIL`. See [`.env.example`](../.env.example).

**Removed:** NextAuth / Auth.js, dev-login bypass, `AUTH_SECRET`, `AUTH_GOOGLE_*`.

---

## 5. Job lifecycle

Jobs do **not** store a status enum. Status is **derived** from flags:

| Derived status | Condition |
|----------------|-----------|
| Draft | `published = false`, `archived = false` |
| Active | `published = true`, `archived = false` |
| Closed | `archived = true` |

Default pipeline stages (seed): **New, Reviewing, Shortlisted, Interview, Offered, Rejected,
Withdrawn** — configurable per job.

---

## 6. Templates

Templates bundle reusable job content. Applying a template **copies** a snapshot onto the job;
later template edits do **not** affect existing jobs.

| Included in template | Notes |
|---------------------|-------|
| Job copy (title, description, sections) | Markdown supported |
| Custom form fields | On top of default applicant fields |
| Assessment questions | Sent in integration payload when toggled |
| Stage names | **Extension** beyond original take-home spec |

---

## 7. Divergences from original take-home draft

Documented intentionally — see archived spec for original wording.

| Original spec | ScoutLane today | Rationale |
|---------------|-----------------|-----------|
| No centralized careers portal | Careers board at `/` | Demo discoverability; job pages still direct-linkable |
| Google OAuth only (NextAuth) | Clerk invitation-only + guest | Controlled access for recruiters and demos |
| Single admin role | Four roles + team management | Realistic team workflows |
| Default stages: Applied, Screening… | New, Reviewing, Shortlisted… | Product choice; fully configurable |
| Every action via REST API | REST + Server Actions | Faster delivery; partial API parity (`docs/API.md`) |
| — | Org-wide webhooks, job-fit score, email templates, job alerts | Production hardening beyond MVP |

---

## 8. Demo script (10 minutes)

Present to a non-technical hiring manager.

1. **Public** — Open `/`, search a role, open `/careers/[slug]`, submit application.
2. **Sign in** — `/signin` (invite) or **Continue as Guest** for read-only tour.
3. **Dashboard** — `/admin` stats and charts.
4. **Template → job** — `/admin/templates`, create job from template, publish.
5. **Pipeline** — Drag applicant on Kanban; show stage log.
6. **Applicant** — Parsed resume, original PDF, notes, score.
7. **Integration** — Configure webhook.site URL; move stage; show log + payload.
8. **Export** — CSV from applicants list.
9. **Team** — `/admin/settings` roles (admin only).

---

## 9. Known gaps (honest)

See [`GAPS.md`](../GAPS.md) and [`ASSESSMENT-PROGRESS.md`](./ASSESSMENT-PROGRESS.md).

- Server Actions cover many admin mutations; full REST API parity is incomplete.
- Worker processes (`pnpm worker:resume`, `pnpm worker:emails`) required off Vercel.
- Advanced analytics (conversion rate, time-to-hire) are partial.
- Security items catalogued in `GAPS.md` (integration SSRF, apiKey in RSC, etc.).

---

## 10. Related docs

| Doc | Purpose |
|-----|---------|
| [PROJECT-GUIDE.md](./PROJECT-GUIDE.md) | Flows, admin manual, short demo plan |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System design and data model |
| [API.md](./API.md) | REST + Server Actions |
| [SETUP.md](./SETUP.md) | Local and deploy setup |
| [ASSESSMENT-PROGRESS.md](./ASSESSMENT-PROGRESS.md) | Take-home requirement matrix |
