# ScoutLane Security Audit

Last reviewed: 2026-05-28. (See "Evidence Collected — 2026-05-28" at the end for concrete proof gathered during the take-home finish.)

This is an evidence-based security audit for ScoutLane. It is not a guarantee that the app is free of all vulnerabilities. The goal is to make the current posture inspectable, identify proof that must be collected, and define the next hardening work before a production or evaluator-facing release.

## Audit Summary

ScoutLane already has useful security foundations: Auth.js sessions, role-gated admin routes, service-level session checks, Zod validation on important inputs, Prisma parameterized access, noindexed public job pages, external service keys in environment variables, async resume processing, and logs for email and integration outcomes.

The main risks to close or prove are public endpoint abuse, file upload hardening, production auth configuration, security headers, dependency and secret scanning, REST/API parity for auditable actions, and safe handling of candidate data in logs, exports, and integrations.

## Control Matrix

| Area | Current Evidence | Risk | Required Proof / Next Action | Status |
|---|---|---|---|---|
| Authentication | Auth.js v5, Google OAuth, JWT sessions, `INITIAL_ADMIN_EMAIL`, middleware gate | Dev credentials provider is enabled when Google OAuth is missing | Prove production has Google OAuth configured and `NODE_ENV=production`; document preview/staging policy | P0 |
| Authorization | `requireSession()` re-checks DB user and organization; workspace roles are `ADMIN`, `RECRUITER`, `HIRING_MANAGER` | Middleware alone must not be treated as the security boundary | Keep route handlers and Server Actions scoped by user organization; add tests for role denial and cross-org access | P0 |
| Tenant isolation | Models include `organizationId` on users/jobs/templates; many services scope by organization | Applicant and job reads must consistently prove ownership | Add audit checklist over all admin routes/actions for `organizationId` or job ownership checks | P0 |
| Public routes | `/careers/*`, `/api/public/*`, `/api/health` are intentionally public | Application and job-alert endpoints can be abused | Add rate-limit plan and abuse tests for apply/job-alert/status endpoints | P0 |
| Input validation | Zod schemas exist for jobs, templates, application submit, and public routes | Some Server Actions may rely on form assumptions instead of complete schema validation | Inventory every Route Handler and Server Action; require Zod parse at trust boundaries | P1 |
| File uploads | Resume is uploaded to Google Cloud Storage before applicant creation | Need explicit size, MIME sniffing, allowed extension, and malware-risk policy | Add upload hardening tests and document max size/types; ensure errors are generic | P0 |
| Resume parsing / LLM | OpenRouter call is isolated in `src/lib/llm`; parsed output is structured | Resume text is untrusted and can contain prompt injection attempts | Document resume text as untrusted input; validate model output with schema; add malicious-resume regression cases | P1 |
| Secrets | `.env.example` contains placeholders; `.env*` ignored | No current proof of secret scan or rotation history | Add Gitleaks/secret scan evidence before push; rotate exposed or demoed keys within 24h | P0 |
| Dependencies | `pnpm` lockfile expected; package overrides present for vulnerable ranges | No committed SBOM or dependency audit evidence in docs | Run `pnpm audit --prod`; enable Dependabot; optionally add Semgrep/Trivy in CI | P1 |
| Webhooks / integrations | Per-stage integrations log status; retry/test actions exist; idempotency uses `stageTransitionId` | Endpoint URLs can send candidate data to external systems by design | Mask API keys in UI/logs; test failure logging and retry behavior | P0 |
| Logging | `EmailLog`, `IntegrationLog`, `WebhookLog`, `StageTransition` exist | Logs may include request/response bodies with sensitive candidate data | Avoid logging secrets, tokens, full request bodies, and raw resumes | P1 |
| Security headers | Next.js defaults apply; no dedicated header policy documented | Missing explicit CSP/HSTS/frame/referrer/permissions policy proof | Add header hardening plan and verify with browser/security scanner | P1 |
| CSRF / session safety | Auth.js manages session cookies; admin actions are same-site app flows | Destructive actions need route/action-level auth and origin assumptions reviewed | Review delete/export/mutation flows; ensure no public mutation bypass exists | P1 |
| Availability | pg-boss offloads resume parsing; worker can retry | Public forms, parsing, and integration test endpoints can create cost/queue load | Add rate limits, queue concurrency docs, and OpenRouter budget controls | P1 |
| Backups / restore | PostgreSQL provider is external; no restore evidence in repo docs | Losing applicant/resume data is high impact | Document provider backup policy and run a test restore before production data | P1 |
| Incident response | Handoff notes exist | No security-specific breach/rollback runbook | Add minimal incident response section in handoff | P1 |

## P0 Evidence Checklist

- Confirm production auth uses Google OAuth and does not expose dev login.
- Confirm every admin Route Handler and Server Action re-verifies auth and organization ownership.
- Run secret scan before pushing `docs-update`.
- Run dependency audit and record unresolved advisories.
- Verify public application submission rejects oversized, unsupported, missing, and duplicate resume/email cases.
- Verify webhook/integration logs do not expose bearer keys.
- Confirm `.env*` files are ignored and not staged.
- Confirm only curated docs are staged from `/docs`.

## Recommended Security Tooling

Minimum local/CI tooling:

```bash
pnpm lint
pnpm typecheck
pnpm test -- --run
pnpm build
pnpm audit --prod
```

Recommended additions before production:

- Gitleaks for secret scanning.
- Dependabot for npm advisory PRs.
- Semgrep for TypeScript/Next.js static checks.
- OWASP ZAP baseline against staging.
- Optional SBOM generation with Syft for release artifacts.

## Agent Rules

- Never commit real secrets, tokens, service account keys, or `.env*` files.
- Never treat `middleware.ts` as the only admin authorization layer.
- Validate every new API route or Server Action input with Zod.
- Never expose stack traces, SQL errors, internal paths, or provider errors directly to candidates.
- Never log raw resumes, bearer tokens, API keys, full cookies, or complete request bodies containing sensitive candidate data.
- Use parameterized Prisma queries only; do not use string-concatenated SQL.
- Keep destructive actions and exports behind authenticated, organization-scoped checks.

## Evidence Collected — 2026-05-28

Concrete proof gathered during the take-home finish. Phrasing follows the project rule: **current evidence / remaining risk / next proof needed.**

### Admin route auth + org-scoping (closes P0 "Authorization" + "Tenant isolation")

All 7 admin Route Handlers resolve the session, load the calling user, and scope the resource by `organizationId`; cross-org access is rejected.

| Route | `auth()` / session | Org-scoped | Evidence |
|---|---|---|---|
| `POST /api/admin/applicants/[applicantId]/rescore` | Yes | Yes | `applicant.job.organizationId !== user.organizationId` → reject |
| `* /api/admin/jobs/integrations/[integrationId]` | Yes | Yes | `integration.job.organizationId !== user.organizationId` → reject |
| `POST /api/admin/jobs/parse-retry/[applicantId]` | Yes | Yes | `applicant.job.organizationId !== user.organizationId` → reject |
| `GET /api/admin/jobs/[id]/applicants/export` | Yes | Yes | `where: { id: jobId, organizationId: user.organizationId }` |
| `GET/POST /api/admin/jobs/[id]/form` | Yes (`getCurrentUserWithOrganization`) | Yes | `where: { id, organizationId: user.organizationId }` |
| `* /api/admin/jobs/[id]/integrations` | Yes | Yes | `where: { id: jobId, organizationId: user.organizationId }` |
| `GET /api/admin/jobs/[id]/pipeline` | Yes | Yes | `where: { id, organizationId: user.organizationId }` |

**Remaining risk:** no automated cross-org isolation test. **Next proof needed:** Playwright/Vitest case signing in as org-A asserting 403/404 on an org-B resource.

### Rate limiting (closes P0 "Public routes" — apply path)

Public application submission is rate-limited per IP (~10/min, fixed window) in both submit paths:
- JSON endpoint `POST /api/public/jobs/[slug]/applications/route.ts`
- Multipart Server Action `src/server/services/submit-job-application.ts`

Limiter: `src/lib/rate-limit.ts` (unit-tested, `src/lib/rate-limit.test.ts`).

**Remaining risk:** in-memory, per-instance; resets on cold start; not distributed. `/api/public/job-alerts` not yet limited. **Next proof needed:** back with Upstash Redis / Vercel KV; extend to job-alerts.

### Upload caps + content type

Limits are centralized in `src/lib/storage/upload-limits.ts` (single source of truth): **5 MB** max + MIME/extension allowlist (PDF/DOC/DOCX/CSV). They are enforced at two layers:

1. **Request boundary** — `resumeFileSchema` (`src/schemas/application.ts`) consumes the shared constants and rejects on submit.
2. **Storage layer (defense-in-depth)** — `uploadResumeFile` (`src/lib/storage/upload.ts`) re-asserts via `assertResumeUploadAllowed`, so any future caller of the storage entrypoint cannot bypass the guard.

Unit-tested in `src/lib/storage/upload-limits.test.ts` (size cap, empty file, MIME/extension allow + reject). Custom application fields are text-only — the `file` custom-field type was removed (resume upload is the only file mechanism). **Remaining risk:** no magic-byte sniffing (trusts the declared MIME/extension). **Next proof needed:** content-sniff the uploaded buffer (`file-type`).

### Dependency advisories — `pnpm audit --prod` (2026-05-28)

Initial scan: `4 vulnerabilities: 1 high, 3 moderate.` After applying the `next` patch bump (below): **`3 vulnerabilities: 3 moderate`** — the high is resolved.

| Severity | Package | Vulnerable | Patched | Status |
|---|---|---|---|---|
| ~~high~~ → fixed | `next` | `>=16.0.0 <16.2.6` | `>=16.2.6` | **FIXED** — bumped `next` 16.2.5 → **16.2.6** (GHSA-26hh-7cqf-hhc6, middleware/proxy bypass). Re-verified: typecheck + 124 tests + build pass. |
| moderate | `uuid` | `<11.1.1` | `>=11.1.1` | Open — transitive via `@google-cloud/storage`, `resend>svix` (GHSA-w5hq-g745-h8pq). Not on a user-input path. No direct upgrade without bumping those parents. |
| moderate (×2) | (transitive) | — | — | Open — transitive; see full `pnpm audit --prod`. |

**Remaining risk:** 3 moderate transitive advisories (`uuid`) with no direct fix. **Next proof needed:** upstream `@google-cloud/storage` / `svix` releases that pull `uuid >= 11.1.1`.

### Secret scan (2026-05-28)

`git grep -nE "(re_|sk_|sk-or-v1-|gho_|AIzaSy|GOCSPX-)[A-Za-z0-9_-]{16,}"` over the tracked tree (Gitleaks unavailable in this environment). **Result: clean** — only placeholder examples in `docs/SETUP.md`. No live secrets committed; `.env*` is gitignored. **Remaining risk:** tree-only, not history. **Next proof needed:** full-history scan in CI.

### Email HTML sanitization (PR #79)

Outbound email bodies are sanitized server-side with an allowlist (`src/lib/email/sanitize.ts`); admin preview renders inside a sandboxed iframe; send errors are scrubbed of secret-like patterns before logging.
