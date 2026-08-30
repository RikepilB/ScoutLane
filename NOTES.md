# NOTES

Running log of bugs / dead code / improvement candidates spotted during the codebase
reorg (move-and-rename only). Logged here instead of fixed inline, per the reorg rules.
See `docs/handoff/2026-07-01-reorg-phase0-safety-net/HANDOFF.md` for full session detail.

## Dead code

- `src/components/VideoHero.tsx` — zero references anywhere in the codebase.
- `src/server/services/_lib/errors.ts` (`ServiceError`, `unauthorized()`, `notFound()`) — defined, zero call sites.

## Likely duplicated logic

- `src/components/admin/NewJobForm.tsx` (544 ln) vs `src/app/(admin)/admin/jobs/[id]/edit/_components/EditJobForm.tsx` (440 ln) — near-identical `useForm`/`zodResolver`/`FormField` shape (16 vs 17 matching call sites). Candidate for a shared-form extraction.

## Oversized files (>300 lines, future split candidates)

- `prisma/seed.ts` — 681
- `src/app/(admin)/admin/jobs/[id]/applicants/page.tsx` — 602
- `src/app/(admin)/admin/jobs/[id]/applicants/[applicantId]/page.tsx` — 555
- `src/components/admin/NewJobForm.tsx` — 544
- `src/app/(admin)/admin/templates/[id]/_components/TemplateEditor.tsx` — 510
- `src/components/public/CareersJobBoard.tsx` — 477
- `src/app/(admin)/admin/jobs/[id]/edit/_components/EditJobForm.tsx` — 440
- (300–350 range) `admin/settings/page.tsx`, `(public)/careers/[slug]/page.tsx`, `admin/applicants/page.tsx`, `StagesManager.tsx`, `ApplicationForm.tsx`

None exceed the 800-line hard max from `.claude/rules/common/coding-style.md`.

## Security / hardening findings (from deep-catch-up scan, 2026-07-01)

- **High** — `src/lib/webhook/sign.ts:3` — signing secret silently defaults to `""` if `INTEGRATION_KEY_SECRET` is unset, instead of throwing. Risk: unsigned webhooks ship silently in prod.
- **High** — `src/app/api/admin/jobs/[id]/integrations/route.ts:47` — integration API keys stored plaintext in DB. Tracked as GitHub issue #103.
- **Med** — `src/server/services/pipeline/update-impl.ts:24` — unmapped pipeline stage name silently degrades to `"REVIEWING"`, no log/error. Relates to GitHub issue #105.
- **Med** — `src/lib/rate-limit.ts` — in-memory rate limiter resets per cold start; unsafe for multi-instance Vercel prod (needs Upstash Redis / Vercel KV).
- **Med** — `src/app/api/public/job-alerts/route.ts` — no rate limiting.
- **Med** — `src/lib/storage/upload-limits.ts` — resume upload validation trusts declared MIME/extension only, no magic-byte check.
- **Med** — `src/lib/resume/access.ts:25` — resume access guard does exact string match on `/api/resumes/` URL; fragile if URL construction diverges elsewhere.
- **Med** — inconsistent API error response shapes (`{error}` vs `{success,error}`) across routes.
- **Low** — transitive `uuid<11.1.1` advisory via `@google-cloud/storage`/`resend` (GHSA-w5hq-g745-h8pq).
- **Low** — no automated cross-organization isolation test (org-A/org-B 403/404 denial).
- **Low** — unused `Session` Prisma model (JWT session strategy, model never read/written at runtime) — already flagged in `CLAUDE.md`.
- **Low** — pipeline stage→status mapping undertested (`pipeline/route.test.ts` only has the happy path).

## Doc staleness

- **Status (2026-08-29):** README's doc-index and test count fixed (see GAPS.md G22). `docs/API.md` may still reference the deleted `docs/HANDOFF.md` — not checked this pass; `docs/*` edits go through the dedicated docs worktree per `docs/CLAUDE.md`, out of scope here.
- `docs/API.md` / README doc-index still reference `docs/HANDOFF.md`, which was deleted 2026-07-01 (superseded by `docs/handoff/` tree).
- Some doc references cite a stale test count ("54 tests / 10 files"); as of 2026-08-29 the true count is 271 tests / 49 files.

## Structural (organization-only) fix — proposed, not yet applied

- `src/components/AnimatedBackground.tsx` and `src/components/VideoHero.tsx` sit loose at `src/components/` root while every other component is grouped by feature folder (`admin/ applicants/ dashboard/ pipeline/ public/ ui/`). Proposed move: both → `src/components/public/`, update the 2 import sites (`SignInForm.tsx`, `VideoHero.tsx` itself).
