# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Package manager

Always `pnpm` (lockfile is `pnpm-lock.yaml`; `package-lock.json` is stale and should be ignored).

## Commands

```bash
pnpm dev                              # Next.js dev server with --turbo, port 3000
pnpm build                            # Production build
pnpm lint                             # ESLint (next lint)
pnpm typecheck                        # tsc --noEmit
pnpm test                             # Vitest (jsdom, watches by default)
pnpm test -- --run                    # Run vitest once (CI mode)
pnpm test -- path/to/file.test.ts     # Single test file
pnpm test -- -t "name fragment"       # Single test by name pattern
pnpm test:e2e                         # Playwright (none configured yet)

pnpm prisma:generate                  # Regenerate Prisma client (also runs on postinstall)
pnpm prisma:migrate --name <name>     # Create + apply a migration (dev)
pnpm prisma:deploy                    # Apply pending migrations (prod-style)
pnpm prisma:reset                     # Drop + remigrate + re-seed
pnpm db:seed                          # Run prisma/seed.ts
pnpm db:studio                        # Prisma Studio GUI
```

CI sequence is `lint → typecheck → test → build`. There are currently no `*.test.{ts,tsx}` files in `src/`; Vitest is wired up but unused.

## Architecture

### Route groups and the `(admin)/admin/*` double nesting

The App Router uses two route groups: `src/app/(public)/` and `src/app/(admin)/`. The `(admin)` group currently contains a second `admin/` segment (`src/app/(admin)/admin/jobs/page.tsx` → URL `/admin/jobs`). The double nesting is intentional for now — `(admin)` controls layout/auth and `admin/` controls the URL prefix. If you flatten it, the URL changes from `/admin/*` to `/*` and the middleware matcher needs an update.

Known cosmetic issue: `(admin)/admin/jobs/[id]/applicants/[applicantId]_components/` should be `[applicantId]/_components/` — the segment and the underscore-prefixed private folder were collapsed by mistake.

### Auth

- **NextAuth v5 (beta)**, config in `src/lib/auth/auth.config.ts`. Session strategy is **JWT, not database** — `README.md` and `AGENTS.md` say "database sessions"; the actual config is `strategy: "jwt"`. The `Session` Prisma model exists but is unused at runtime.
- **Dev-only `Credentials` provider** registered when `NODE_ENV === "development"` (provider id `"dev"`). Lets you sign in by typing any email and get `role: "ADMIN"` — used by the home page's dev-login form. Do not ship this to prod.
- **Middleware** (`src/middleware.ts`) is stricter than the README implies: any non-`ADMIN` role hitting `/admin/*` is redirected to `/access-denied`. `RECRUITER` and `HIRING_MANAGER` are *blocked* despite being valid `UserRole` values. Public paths bypass auth: `/`, `/signin`, `/api/health`, `/careers/**`, `/api/public/**`.
- Role/userId are written onto the JWT in `callbacks.jwt` and surfaced via `session.user.role` — see `src/types/next-auth.d.ts` for the augmented Session type.

### Prisma client lives in `src/generated/prisma/`

The schema sets `output = "../src/generated/prisma"`. Import from `@/generated/prisma/client` (or `/enums`, `/models`), **never** from `@prisma/client`. `src/generated/` is gitignored — running `pnpm install` triggers `postinstall → prisma generate` to rebuild it. If imports break after a fresh clone or pull, run `pnpm prisma:generate`.

The Prisma client uses the `@prisma/adapter-pg` driver adapter over a `pg.Pool` (see `src/lib/db/prisma.ts`) — not the default Rust engine. `next.config.ts` includes `@prisma/client` and `pg-boss` in `serverExternalPackages` so they're not bundled.

### Service layer

Business logic lives in `src/server/services/*.ts` (e.g. `pipeline.ts`, `applicants.ts`, `templates.ts`, `settings.ts`, `current-user.ts`). API routes under `src/app/api/admin/*` are intended to stay thin and delegate. Zod schemas in `src/schemas/` are imported by both server and client.

Most admin REST endpoints listed in `README.md` are **scaffolded but not implemented** — only `api/admin/jobs/[id]/pipeline/route.ts` exists. Admin pages currently call services directly (RSC) rather than via fetch.

### Pipeline ↔ status coupling

`src/app/api/admin/jobs/[id]/pipeline/route.ts` groups applicants by uppercasing `PipelineStage.name` and matching it against the `ApplicationStatus` enum. Stage names that don't match enum values (`NEW`, `REVIEWING`, `SHORTLISTED`, `INTERVIEW`, `OFFERED`, `REJECTED`, `WITHDRAWN`) silently produce empty columns. The seed creates stages named `New / Screening / Interview / Offer / Hired` — only `NEW` and `INTERVIEW` actually match.

### Background workers

`src/server/workers/` exists but contains only `.gitkeep`. The README/AGENTS describe pg-boss workers for resume parsing, email, and webhook dispatch — none are wired up yet. Treat any task about "the worker" as greenfield.

### Snapshot templates

Per `AGENTS.md`: applying a `JobTemplate` **copies** fields/stages/questions onto the `Job`. Editing a template later does not affect existing jobs. Preserve this when touching template-apply logic.

## Conventions

- Path alias: `@/*` → `./src/*` (set in both `tsconfig.json` and `vitest.config.ts`).
- Conventional commits (`feat:`, `fix:`, `chore:`, ...) — see recent git log.
- shadcn/ui primitives under `src/components/ui/` (config in `components.json`). When adding a new shadcn component, do not edit `components/ui/*` by hand outside the generator's output unless the change is intentional.
- Server Components by default. Mark client components with `"use client"` only when needed (forms, dnd, charts).

## Documentation overlap

`README.md` (committed) and `AGENTS.md` (gitignored, kept locally) cover similar ground. When they disagree, the code is the source of truth — and both currently overstate completion of admin APIs, workers, and database sessions. Update this file or `README.md` rather than `AGENTS.md` for anything you want to persist.
