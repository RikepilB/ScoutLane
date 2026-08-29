# ScoutLane — Known Gaps & Weaknesses

> Honest audit, most severe first. Each item: **what · where · why it matters · fix**
> (fix scoped small enough for a single focused task). Verified against code on
> 2026-07-07, branch `fix/mask-integration-api-key-input`. Cross-refs to the
> pre-existing `NOTES.md` log and GitHub issues where they exist.

Severity legend: 🔴 Critical/High · 🟠 Medium · 🟡 Low · ⚪ Debt/cleanup.

---

## 🔴 Security

### G1. Authenticated SSRF via integration `endpointUrl`
- **Status (2026-07-17 WIP):** Resolved in the current uncommitted worktree by
  `validateEgressUrl`, DNS/IP checks, and validation at all outbound call sites. Not deployed.
- **What:** A workspace user registers an integration with any `endpointUrl` (validated
  only as truthy). The server then POSTs to it and stores up to 10 KB of the *response
  body* in `IntegrationLog`, which is rendered in the admin UI — a full **read SSRF**
  (cloud metadata `169.254.169.254`, `localhost`, internal services).
- **Where:** creation with no URL check `src/app/api/admin/jobs/[id]/integrations/route.ts:16-19,46`;
  server-side fetches `src/app/api/admin/jobs/integrations/[integrationId]/route.ts:58,115`
  and `src/server/services/pipeline/update-impl.ts:163-183`; response surfaced in
  `.../integrations/_components/IntegrationList.tsx:130-147`.
- **Why:** Any authenticated recruiter can exfiltrate internal network responses.
- **Fix:** Add a URL validator (https-only; reject private/loopback/link-local IP ranges
  after DNS resolution; block metadata IPs) and call it at integration create + before
  every outbound fetch. One helper `src/lib/webhook/validate-egress-url.ts`, wired into 3
  call sites.

### G2. Integration bearer `apiKey` serialized into the browser RSC payload
- **Status (2026-07-17 WIP):** Resolved in the current uncommitted worktree by projecting and
  returning non-secret integration fields only. Not deployed.
- **What:** The recent masking fix (`d1d02c7`) only made the *input* `type="password"`.
  The server component still loads full integration records (Prisma `include`, no
  `select` — `apiKey` included) and passes them to a `"use client"` component. Props
  crossing the server→client boundary are serialized into the Flight payload regardless
  of the TS interface (types erase at runtime), so the token reaches the browser.
- **Where:** `src/app/(admin)/admin/jobs/[id]/integrations/page.tsx:17-28` (no field
  projection) → `:47` passes `job.integrations` to `IntegrationList` (`"use client"`).
- **Why:** Bearer tokens for customer systems leak to the browser network tab / cache.
- **Fix:** In that page query, `select` only non-secret fields (or `map` to strip
  `apiKey`) before passing to the client component. Single-file change.

### G3. Integration `apiKey` stored plaintext at rest (issue #103)
- **Status (2026-08-29): Code resolved and deployed** via PR #124 — `apiKey`/webhook
  `secret` now encrypted at rest (AES-256-GCM, `src/lib/security/integration-secrets.ts`),
  with an additive migration script (`pnpm db:encrypt-integration-secrets`) that only
  touches legacy plaintext rows (idempotent, transactional). `decryptSecret` deliberately
  passes through un-migrated plaintext, so existing integrations keep working either way.
  **Still open:** `INTEGRATION_SECRETS_ENCRYPTION_KEY` isn't confirmed set in Vercel prod —
  without it, *new* integration/webhook secret writes throw (reads of already-plaintext
  rows are unaffected). Needs the key set + the migration script run against prod once it
  is; both require prod credentials this agent doesn't have. A follow-up branch
  `fix/encrypt-integration-secrets` (worktree `C:/tmp/ScoutLane-encrypt-secrets`, unmerged,
  not reviewed as part of this pass) adds key-rotation support
  (`INTEGRATION_SECRETS_PREVIOUS_ENCRYPTION_KEY`) and response-body redaction on top.
- **What:** `JobIntegration.apiKey` and `endpointUrl` are stored unencrypted and sent as
  `Authorization: Bearer` on outbound calls.
- **Where:** `prisma/schema.prisma:263`; written at
  `src/app/api/admin/jobs/[id]/integrations/route.ts:46`; used at
  `src/server/services/pipeline/update-impl.ts:167`. Tracked as GitHub issue #103,
  `NOTES.md:32`.
- **Why:** DB dump or read-access exposes third-party credentials.
- **Fix:** Encrypt at rest with an app key (AES-GCM via `node:crypto`), decrypt only at
  dispatch time. New `src/lib/crypto/secret-box.ts` + a migration is out of scope for a
  "small" task; the minimal first step is G2 (stop leaking to the client) then encrypt.

### G4. Webhook signing secret silently defaults to empty string
- **Status (2026-07-17 WIP):** Resolved in the current uncommitted worktree with production
  fail-closed signing and timing-safe verification. Not deployed.
- **What:** `INTEGRATION_KEY_SECRET || ""` — if the env var is unset, payloads are HMAC'd
  with an empty key instead of throwing. Signatures become forgeable if `verifyPayload`
  is ever wired to an inbound endpoint (currently it has no inbound consumer, so impact
  is latent). Also `verifyPayload` compares with `===` (timing-unsafe).
- **Where:** `src/lib/webhook/sign.ts:3` (default), `:10` (comparison). `NOTES.md:31`.
- **Why:** Ships unsigned/forgeable webhooks with no signal.
- **Fix:** Throw at module load if `INTEGRATION_KEY_SECRET` is missing in production;
  swap `===` for `crypto.timingSafeEqual`. Add `INTEGRATION_KEY_SECRET` to `.env.example`
  (it's currently missing there).

### G5. Coarse RBAC — all three workspace roles are equal in practice
- **What:** Every `/api/admin/*` route and every server action authorizes on
  *authenticated + has organization* only, never on role. So `HIRING_MANAGER` and
  `RECRUITER` can export all applicant PII, delete jobs, and create/delete integrations —
  same as ADMIN. Only org-scoping (tenant isolation) is enforced.
- **Where:** representative: `src/app/api/admin/jobs/[id]/applicants/export/route.ts:17-27`,
  `.../applicants/[applicantId]/rescore/route.ts:10-19`,
  `.../jobs/[id]/integrations/route.ts:9-25`; the shared gate
  `src/server/services/current-user.ts` has no role param; middleware gates the whole set
  collectively `src/middleware.ts:44-50`. (`settings.ts` IS the exception — it has a
  local `requireAdmin`.)
- **Why:** If the roles are meant to differ, this is a privilege-separation gap.
- **Fix:** Decide the intended matrix, add a `requireRole(user, ["ADMIN"])` helper in
  `_lib/`, and apply to sensitive ops (export, delete, integrations). Confirm intent
  first — may be by-design for the take-home.

### G6. Rate limiter is bypassable and incomplete
- **What:** (a) client IP is taken from the *leftmost* `x-forwarded-for`, which the
  client controls — rotate it to defeat the limiter. (b) In-memory per-instance, resets
  on cold start, doesn't span serverless instances. (c) The public job-alerts subscribe
  POST has **no** limiter at all.
- **Where:** `src/lib/rate-limit.ts:60-64` (XFF), `:26-54` (in-memory);
  `src/app/api/public/job-alerts/route.ts:9-21` (unthrottled). `NOTES.md:34-35`.
- **Why:** Email-send abuse / enumeration on the unauthenticated surface.
- **Fix (small):** Add the existing `createRateLimiter` to the job-alerts route (mirror
  the applications route). Trust the platform-provided client IP (rightmost trusted hop
  or a Vercel header) instead of the leftmost XFF. Redis-backing is a larger follow-up.

### G7. Resume upload accepts client-declared type only (no content sniffing)
- **What:** A file is accepted if its MIME **or** extension matches — both client-supplied;
  no magic-byte validation. Worse, the primary submit path uploads via `uploadFileBuffer`
  directly, bypassing the `assertResumeUploadAllowed` storage-layer guard, relying solely
  on the Zod schema.
- **Where:** `src/lib/storage/upload-limits.ts:44-56`; schema mirror
  `src/schemas/application.ts:25-30`; primary path
  `src/server/services/submit-job-application-impl.ts:106`; guard only wired into
  `uploadResumeFile` at `src/lib/storage/upload.ts:240-244`. `NOTES.md:36`.
- **Why:** Polyglot/malicious file stored and handed to parsers and recruiters. (Mitigated
  by `nosniff` + controlled `Content-Disposition` + sanitized docx preview.)
- **Fix:** Add a magic-byte check (first bytes for `%PDF`, PK zip for docx) in
  `assertResumeUploadAllowed`, and call that guard from the primary submit path.

### G8. CSV export — formula injection not neutralized
- **What:** `csvEscape` quotes `",\n` but doesn't neutralize leading `= + - @`. Applicant
  `name`/`email`/custom values flow into the export → Excel/Sheets formula injection.
- **Where:** `src/app/api/admin/jobs/[id]/applicants/export/route.ts:5-10,57-69`.
- **Why:** Opening an exported CSV can execute attacker-controlled formulas.
- **Fix:** Prefix any field starting with `= + - @` with a `'` (or space) inside
  `csvEscape`. One-function change.

---

## 🟠 Test coverage

### G9. Middleware and the central auth gate are untested
- **What:** `src/middleware.ts` (public allowlist, unauth→/signin, non-role→/access-denied)
  has **no test** — only the underlying `auth.config.ts` helpers are unit-tested. The
  reusable `requireSession()` gate and `getCurrentUserWithOrganization()` are also untested
  directly.
- **Where:** `src/middleware.ts`, `src/server/services/_lib/validate-session.ts`,
  `src/server/services/current-user.ts`.
- **Why:** The role gate is the front-line authz control; a regression is silent.
- **Fix:** Add `src/middleware.test.ts` covering: public path bypass, unauth redirect,
  authed-non-workspace-role → /access-denied, workspace-role → next. Mock `auth`.

### G10. Whole service functions with zero tests
- **What:** No tests for `settings.ts` (incl. `updateTeamMemberRole` — the role-escalation
  surface), `templates.ts` (CRUD), `pipeline/stages-impl.ts`, `pipeline/update-impl.ts`
  `moveApplicantImpl` real logic (only its route mock is tested), `applicants/notes-impl.ts`,
  `applicants/read.ts`, and most of `applicants/update-impl.ts` (only `deleteApplicantImpl`
  is tested), `jobs/update-impl.ts`, `jobs/delete.ts`, `job-alerts.ts`,
  `emails/dispatch-email-job.ts`.
- **Where:** `src/server/services/**`.
- **Why:** These hold the org-scoping and status-derivation logic; regressions are how
  cross-tenant leaks and wrong-status bugs get shipped.
- **Fix:** Prioritize one file at a time, mocked Prisma (pattern already established in
  `update-impl.test.ts`). Start with `pipeline/update-impl.ts` (`deriveStatus` + ownership)
  and `settings.ts` (role change).

### G11. Playwright e2e is not in CI
- **What:** CI runs only `pnpm test` (vitest, fully mocked — no real DB, HTTP, browser, or
  worker). The only end-to-end coverage of the public apply flow, middleware redirects, and
  the real server actions is `tests/e2e/smoke.spec.ts`, which CI never runs.
- **Where:** `.github/workflows/ci.yml` (no playwright step); `tests/e2e/smoke.spec.ts`.
- **Why:** The money path (application submit → upload → queue → email) has no gating
  coverage on a normal PR.
- **Fix:** Add a separate CI job that boots the Postgres service, seeds, and runs
  `pnpm test:e2e` with a real `DATABASE_URL`. Larger task; the smaller first step is to
  document it as intentionally-manual in `docs/TESTING.md`.

### G12. API routes with no test (8 of 14)
- **What:** Untested: `health`, CSV `export`, `rescore`, both `integrations` CRUD routes
  (store secrets), `parse-retry`, resume `preview`, public `job-alerts`.
- **Where:** `src/app/api/**`.
- **Fix:** Add route tests mirroring the existing `move/route.test.ts` pattern (401/403/400
  + delegation). One file per route; start with the two integrations routes (secret-handling).

---

## 🟠 Correctness / fragility

### G13. Pipeline stage name → status mapping silently degrades (issue #105)
- **Status (2026-07-17 WIP):** Resolved in the current uncommitted worktree with an explicit
  `PipelineStage.status` field and additive backfill migration. Not deployed.
- **What:** `deriveStatus` uppercases the stage name and maps to `ApplicationStatus`;
  unmapped names silently become `REVIEWING` with no log or error. The seed's default
  stages (`New/Screening/Interview/Offer/Hired`) only partly match the enum — several map
  by luck, others fall through.
- **Where:** `src/server/services/pipeline/update-impl.ts:8-25`; the same coupling in the
  read path `src/app/api/admin/jobs/[id]/pipeline/route.ts` (uppercase-name grouping).
  Issue #105, `NOTES.md:33`.
- **Why:** Applicant status can be quietly wrong, corrupting dashboards and filters.
- **Fix:** Log a warning when a stage name doesn't map, and surface it. Longer-term:
  make stage→status explicit config on `PipelineStage` rather than name-string matching.

### G14. Outbound integration/webhook fetches have no timeout
- **Status (2026-07-17 WIP):** Resolved in the current uncommitted worktree with 10-second abort
  signals for integration and webhook dispatch. Not deployed.
- **What:** The integration POST and webhook dispatch use `fetch` with no `AbortSignal`.
  A slow/hanging customer endpoint can stall an inline task or request (contrast: the LLM
  client sets a 20s timeout).
- **Where:** `src/server/services/pipeline/update-impl.ts:163`, `src/lib/webhook/dispatch.ts:33`.
- **Why:** On Vercel inline mode, a stage move can hang until the platform kills it.
- **Fix:** Add `AbortSignal.timeout(10_000)` to both fetch calls.

### G15. Resume queue caches a failed pg-boss start permanently
- **What:** `emails.ts` clears the cached boss/start promise on start failure so it can
  retry; `resume.ts` uses `??=` with no such cleanup, so a transient startup failure is
  cached forever in-process.
- **Where:** `src/server/queues/resume.ts:35` vs `src/server/queues/emails.ts:82-88`.
- **Why:** One transient DB hiccup disables resume parsing for the process lifetime.
- **Fix:** Mirror the emails.ts cleanup in resume.ts (clear the cached promise on failure).

### G16. `/[slug]` shortlink is auth-gated by accident; `/careers` has no page
- **What:** The bare `/{slug}` public shortlink is NOT in the middleware public allowlist,
  so anonymous visitors get redirected to `/signin` instead of the job. Separately, a bare
  `/careers` is whitelisted but has no `page.tsx` (404).
- **Where:** allowlist `src/middleware.ts:25-34`; `src/app/[slug]/page.tsx`; missing
  `src/app/(public)/careers/page.tsx`.
- **Why:** "Public shortlink" isn't public; a whitelisted path 404s.
- **Fix:** Add `/[slug]`-style bare paths to the public matcher (carefully — it's a
  catch-all), or redirect `/careers` → `/`. Small, but test the matcher regex.

### G17. Non-org-scoped admin queries
- **Status (2026-07-17 WIP):** The `/admin/integrations` exposure is resolved in the current
  uncommitted worktree. The `/admin` dashboard query still requires separate verification.
- **What:** The `/admin` dashboard and `/admin/integrations` page run counts/lists across
  ALL organizations, unlike every other admin page which scopes by `organizationId`. Same
  pattern in `/admin/notifications`: `EmailLog` has no `organizationId` column at all (the
  model itself isn't tenant-scoped), so its failed-email panel is unconditionally global —
  every org sees every other org's failed applicant emails.
- **Where:** `src/app/(admin)/admin/page.tsx` (counts/groupBy), `.../admin/integrations/page.tsx`,
  `.../admin/notifications/page.tsx:58-62` (`prisma.emailLog.findMany`, no org filter — the
  other two queries on that page already gate on `organizationId`).
- **Why:** In a real multi-tenant deployment this leaks cross-org aggregates.
- **Fix:** Add `where: { organizationId }` (via `getCurrentUserWithOrganization`) to those
  page queries, matching the jobs/applicants pages. `EmailLog` needs a schema migration
  (add `organizationId`, backfill, then filter) since it currently has no tenant column.

---

## 🟡 Lower-severity security

### G18. Dev credentials provider grants ADMIN to any email
- **What:** Provider `"dev"` mints an ADMIN session for any email, no password. Correctly
  gated to `NODE_ENV=development || ALLOW_DEV_LOGIN=1` (the old implicit-enable bug is
  fixed). Residual: setting `ALLOW_DEV_LOGIN=1` in a real deploy = full auth bypass.
- **Where:** `src/lib/auth/auth.config.ts:93-135`, `src/lib/auth/sign-in.ts:46-65`.
- **Fix:** Add a hard guard that refuses `ALLOW_DEV_LOGIN=1` when `VERCEL_ENV=production`,
  or at minimum a loud startup warning. Keep it out of all prod env configs.

### G19. Stale role in JWT after a DB role change
- **What:** Role lives in the JWT; a demotion in the DB isn't reflected until token refresh
  (`maxAge` 7d / `updateAge` 1d). Middleware reads role from the token.
- **Where:** `src/lib/auth/auth.ts:15-32`, `src/middleware.ts:23`, `auth.config.ts:140-143`.
- **Fix:** For sensitive actions, re-read role from DB (the `auth.ts` jwt callback already
  does on refresh; sensitive mutations could `requireRole` against DB, not token).

---

## ⚪ Tech debt & cleanup

### G20. Dead code
- `src/server/services/_lib/errors.ts` — `ServiceError`/`unauthorized()`/`notFound()`,
  zero call sites. **Fix:** delete the file.
- `src/components/public/VideoHero.tsx` — exported, no external importer. **Fix:** delete.
- `Session` + `VerificationToken` Prisma models — unused under JWT strategy with only
  OAuth/dev providers. **Fix:** leave for now (removing needs a migration + adapter check);
  document as intentionally-vestigial. `NOTES.md:41`.
- Vestigial `IntegrationLog.webhookId` / `Webhook.logs` cross-relation — never populated in
  code. **Fix:** confirm, then drop in a future schema cleanup.

### G21. Stale on-disk files (not tracked, safe to remove)
- `dev.stderr.txt`, `dev.stdout.txt`, root `handoff.md` (superseded by `docs/handoff/` tree),
  `2026-07-03-180846-….txt` (110 KB session dump), `tsconfig.tsbuildinfo`,
  `app-screenshot.png`, `scoutlane-fixed.png`, `testsprite_tests/` (abandoned, stale at
  Next 15 / 2026-05-12). **Fix:** `rm` the clutter; keep `.gitignore` entries.

### G22. Documentation drift (trust code, then fix docs)
- **Status (2026-07-18 WIP):** The stale `docs/HANDOFF.md` pointer is resolved in the current
  documentation WIP. The remaining README/env/test-count drift below is still open.
- `README.md:235,52` says "15 models" and lists `Session`/`VerificationToken` as live — dead
  under JWT. `README.md:90` `prisma:migrate --name init` collides with the committed `_init`
  migration. `README.md:209` "54 tests / 10 files" is stale (~206 now). `README.md:103-122`
  env table omits `AUTH_ALLOWED_EMAIL_DOMAIN`, `JOB_RUNNER`, `RESUME_PARSE_MODE`,
  `INTEGRATION_KEY_SECRET`, `OPENROUTER_FALLBACK_MODELS`, `OPENROUTER_TIMEOUT_MS`, legacy
  `GOOGLE_CLIENT_ID/SECRET`. `README.md:40`, `AGENTS.md:7`, `docs/CLAUDE.md` point to the
  flat `docs/HANDOFF.md` (frozen 2026-05-20) instead of the live `docs/handoff/` tree.
  `docs/CLAUDE.md` references a dead worktree `C:\tmp\ScoutLane-docs-update`. `NOTES.md:46`
  itself is now wrong (claims `docs/HANDOFF.md` and `session-reports/` were deleted — they
  still exist). **Fix:** one docs-sweep PR correcting the model count, migrate command, test
  count, env table, and handoff pointers.

### G23. Duplicated / inconsistent patterns
- Near-identical form logic in `src/components/admin/NewJobForm.tsx` vs
  `src/app/(admin)/admin/jobs/[id]/edit/_components/EditJobForm.tsx` (no shared abstraction).
  **Fix:** extract a shared `useJobForm` hook + field set.
- Three auth-helper flavors: `requireSession()` (throws, org-guaranteed),
  `getCurrentUserWithOrganization()` (nullable, **auto-creates a fallback org**), and an
  inline re-implementation in `jobs/create-impl.ts:52-78`. Plus a *third* org-creation slug
  scheme in `sign-in.ts:resolveOrganizationId`. **Fix:** consolidate on `requireSession()`;
  make create-impl reuse it; centralize fallback-org creation in one place.
- Two applicant-notes systems: freeform `Applicant.notes` string AND structured
  `ApplicantNote` rows, both live. **Fix:** pick one; migrate + deprecate the other.
- Inconsistent API error shapes (`{error}` vs `{success,error}`) across routes
  (`NOTES.md:38`). **Fix:** adopt one envelope (the `.claude/rules` `ApiResponse<T>` shape).
- Cross-service imports `settings.ts:10` and `templates.ts:8` import `current-user.ts`
  (sibling service) — soft violation of the "services don't import services" rule.
  **Fix:** move `getCurrentUserWithOrganization` into `_lib/` next to `requireSession`.
- Barrel gap: `schemas/index.ts` only re-exports `application` + `job`; `settings`,
  `template`, `customFields` are imported directly. **Fix:** add them to the barrel.
- Applicant status enum duplicated as an inline `z.enum` in
  `applicants/update-impl.ts:7` instead of sharing the Prisma `ApplicationStatus`.

### G24. Schema / index hygiene
- `StageTransition` written on every move but has **no `@@index`** (queried by applicant/job).
- `PipelineStage` ordered by `(jobId, order)` with no composite index.
- `Webhook.events String[]` queried with `has` and no GIN index.
- `ResumeFile.data Bytes` DB BLOB has no size/retention policy.
- `Job`/`JobTemplate` use loosely-typed `Json?` for `requirements`/`toolsAndSkills` that
  actually hold string arrays (could be `String[]`).
- **Fix:** add the three missing indexes in one additive migration; the type/retention items
  are larger follow-ups.

---

## Verified NOT a problem (checked, don't re-flag)
- Resume file access (`/api/resumes/*`): no IDOR, no path traversal — auth + org ownership,
  404 for unowned, root-containment guard. Strongest part of the codebase
  (`src/lib/resume/access.ts`, `storage-read.ts:26-30`).
- HTML sinks: `renderMarkdown` HTML-escapes; email bodies sanitized; docx preview
  allowlisted + `default-src 'none'` CSP.
- No hardcoded secrets in source; `.env.example` holds empty placeholders.
- Newer schema fields (`whatYouWillDo`/`requirements`/`toolsAndSkills`/JobAlert) ARE covered
  by migration `20260519050326_add_job_department_and_descriptions_and_jobalert` — **no
  schema drift** (the `NOTES`/handoff "verify" item resolves clean).
