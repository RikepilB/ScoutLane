# Goal

Finish ScoutLane's final take-home readiness work and public-facing careers experience. Current focus: make public job titles clearly clickable, support a full jobs listing at `/`, keep canonical job pages at `/careers/{slug}`, add short active-job URLs like `/data-scientist`, and preserve the durable resume queue work.

## Current state

Production was previously reported live at `https://scoutlane.vercel.app` with Neon PostgreSQL and core flows verified. Local workspace is not clean and contains both tracked edits and untracked new files. The user will handle the remaining cleanup, staging, CI, and deployment work with another agent.

The public root page now works as a careers board: active jobs are fetched from Prisma, grouped into departments, searchable/filterable, and rendered with blue underlined title/path links. Clicking a title goes to `/careers/{slug}`. A short URL like `/data-scientist` redirects to `/careers/data-scientist` when that job is active. Individual job pages now have a blue "Back to all positions" link to `/` and show Dashboard for logged-in users or Sign in for anonymous visitors.

A previous reviewer P1 remains important: `submit-job-application-impl.ts` imports `@/server/queues/resume`; the queue files exist locally but are untracked, so they must be staged with the import changes or clean checkout builds will fail.

Verification:

- `pnpm typecheck` passed from `C:\tmp\ScoutLane-run`
- `pnpm lint` passed from `C:\tmp\ScoutLane-run`
- `pnpm exec playwright test --list` previously found 6 E2E smoke tests
- Local workspace `pnpm` commands still fail with OneDrive `EPERM` on dependency binaries
- Starting dev server from `C:\tmp\ScoutLane-run` failed due copied dependency state reporting mismatched `@next/swc`

## Files in flight

- `AGENTS.md` - session handoff rule
- `handoff.md` - current handoff
- `README.md`
- `package.json`
- `pnpm-lock.yaml`
- `playwright.config.ts`
- `tests/e2e/smoke.spec.ts`
- `src/app/page.tsx` - public careers board
- `src/app/[slug]/page.tsx` - active job shortlink redirect
- `src/components/public/CareersJobBoard.tsx` - public search/filter/grouped job list
- `src/app/(public)/careers/[slug]/page.tsx` - job detail navigation/styling
- `src/server/queues/resume.ts` - untracked pg-boss enqueue module
- `src/server/workers/resume.ts` - untracked resume worker
- `src/server/services/submit-job-application-impl.ts`
- `src/app/api/admin/jobs/parse-retry/[applicantId]/route.ts`
- `src/components/admin/NewJobForm.tsx`
- `src/app/(admin)/admin/jobs/[id]/applicants/[applicantId]/page.tsx`
- `src/app/(admin)/_components/SidebarNav.tsx`
- `src/app/(admin)/admin/notifications/page.tsx`

## Changed

- Replaced the root "direct links only" public page with a branded careers listing portal.
- Added create-job-alert card, search, department/location/type filters, and grouped job sections.
- Made job titles and public paths blue, underlined, and hover-highlighted.
- Added active job shortlinks such as `/data-scientist` redirecting to `/careers/data-scientist`.
- Updated job detail pages with clearer public navigation and auth-aware Dashboard/Sign in action.
- Earlier in this session, added pg-boss resume queue/worker, E2E smoke scaffolding, notifications page, embedded resume viewer, and multi-step job wizard.

## Failed attempts

- `pnpm typecheck` and `pnpm lint` in the OneDrive workspace failed with `EPERM` opening dependency binaries.
- Dev server from `C:\tmp\ScoutLane-run` failed due copied dependency state: mismatched `@next/swc` and lockfile acquisition error.
- Full Vitest/build are still not verified locally because of the same dependency/OneDrive/copy-state issues.
- `ARCHITECTURE.md` briefly appeared deleted/modified during file operations; it was restored from `HEAD`, but git status may still need a clean refresh on a machine with proper `.git` permissions.

# Next steps

Missing: another agent should stage/commit all untracked files that are referenced by tracked code, especially `src/server/queues/resume.ts`, `src/server/workers/resume.ts`, `src/components/public/CareersJobBoard.tsx`, and `src/app/[slug]/page.tsx`, then deploy the public careers portal changes.

Single next thing: run `git status --short`, confirm all new files are included in the patch, then run CI in a clean environment or Codespaces where pnpm dependencies and `.git` object writes are not blocked.
