# Codebase Structure

**Analysis Date:** 2026-05-13

## Directory Layout

```
ScoutLane/
├── src/
│   ├── app/                              # Next.js App Router
│   │   ├── layout.tsx                    # Root layout
│   │   ├── page.tsx                      # Landing/home page (public)
│   │   ├── middleware.ts                 # Auth middleware (Edge runtime)
│   │   ├── (public)/                     # Route group: public-facing
│   │   │   ├── layout.tsx                # Public layout
│   │   │   └── careers/[slug]/           # Public job listing & application
│   │   │       ├── page.tsx              # Job detail + form
│   │   │       ├── closed/page.tsx       # Closed job message
│   │   │       └── submitted/page.tsx    # Application confirmation
│   │   ├── (admin)/                      # Route group: admin area
│   │   │   ├── layout.tsx                # Admin layout (checks ADMIN role)
│   │   │   ├── _components/Sidebar.tsx   # Sidebar navigation (private folder)
│   │   │   └── admin/                    # Nested segment: URL prefix /admin/*
│   │   │       ├── page.tsx              # Admin dashboard
│   │   │       ├── jobs/
│   │   │       │   ├── page.tsx          # Jobs list
│   │   │       │   ├── new/page.tsx      # Create job form
│   │   │       │   └── [id]/
│   │   │       │       ├── layout.tsx    # Job detail layout
│   │   │       │       ├── page.tsx      # Job overview
│   │   │       │       ├── _components/  # Job detail sub-components
│   │   │       │       ├── applicants/   # Applicants tab
│   │   │       │       │   ├── page.tsx  # Applicants list
│   │   │       │       │   ├── [applicantId]/
│   │   │       │       │   │   ├── page.tsx
│   │   │       │       │   │   └── _components/
│   │   │       │       │   └── [applicantId]_components/ # Cosmetic issue: should be /_components/
│   │   │       │       ├── pipeline/     # Pipeline (kanban) tab
│   │   │       │       │   └── page.tsx
│   │   │       │       ├── form/         # Form builder tab
│   │   │       │       │   └── page.tsx
│   │   │       │       ├── stages/       # Stages config tab
│   │   │       │       │   ├── page.tsx
│   │   │       │       │   └── _components/
│   │   │       │       └── integrations/ # Integrations tab
│   │   │       │           ├── page.tsx
│   │   │       │           └── _components/
│   │   │       ├── templates/
│   │   │       │   ├── page.tsx          # Job templates list
│   │   │       │   └── [id]/page.tsx     # Template detail
│   │   │       └── settings/page.tsx     # Organization settings
│   │   ├── signin/page.tsx               # Sign in page (public)
│   │   ├── access-denied/page.tsx        # Access denied page
│   │   └── api/                          # API routes
│   │       ├── auth/[...nextauth]/route.ts
│   │       ├── health/route.ts
│   │       ├── admin/
│   │       │   └── jobs/
│   │       │       ├── [id]/
│   │       │       │   ├── pipeline/route.ts  # Get pipeline + applicants
│   │       │       │   ├── form/route.ts      # Get form schema (scaffold)
│   │       │       │   └── integrations/route.ts
│   │       │       └── integrations/[integrationId]/route.ts
│   │       └── public/
│   │           └── jobs/[slug]/applications/route.ts
│   │
│   ├── components/                       # Reusable UI components
│   │   ├── ui/                           # shadcn/ui primitives
│   │   │   ├── button.tsx
│   │   │   ├── form.tsx
│   │   │   ├── input.tsx
│   │   │   ├── label.tsx
│   │   │   ├── table.tsx
│   │   │   └── textarea.tsx
│   │   ├── admin/                        # Admin-specific components
│   │   │   ├── ApplicantStatusBadge.tsx
│   │   │   ├── StatusBadge.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   └── NewJobForm.tsx
│   │   ├── dashboard/                    # Dashboard visualizations
│   │   │   └── Charts.tsx
│   │   ├── pipeline/                     # Kanban board components
│   │   │   ├── KanbanBoard.tsx
│   │   │   ├── KanbanColumn.tsx
│   │   │   └── ApplicantCard.tsx
│   │   ├── public/                       # Public-facing components
│   │   │   └── ApplicationForm.tsx
│   │   ├── AnimatedBackground.tsx
│   │   └── VideoHero.tsx
│   │
│   ├── server/                           # Server-only code ("use server")
│   │   └── services/                     # Business logic layer
│   │       ├── jobs/
│   │       │   ├── index.ts              # Barrel export (create, read, update, delete)
│   │       │   ├── create.ts
│   │       │   ├── read.ts
│   │       │   ├── update.ts
│   │       │   └── delete.ts
│   │       ├── applicants/
│   │       │   ├── index.ts
│   │       │   ├── read.ts
│   │       │   └── update.ts
│   │       ├── pipeline/
│   │       │   ├── index.ts
│   │       │   ├── read.ts
│   │       │   ├── update.ts
│   │       │   └── stages.ts
│   │       ├── templates.ts
│   │       ├── settings.ts
│   │       ├── applications.ts            # Public job application submission
│   │       ├── current-user.ts
│   │       ├── _lib/
│   │       │   ├── validate-session.ts   # Auth helpers (requireSession, getCurrentUserId)
│   │       │   └── errors.ts
│   │       └── workers/                  # Background jobs (stub, planned pg-boss workers)
│   │           └── .gitkeep
│   │
│   ├── lib/                              # Shared infrastructure & utilities
│   │   ├── auth/
│   │   │   ├── auth.config.ts            # NextAuthConfig (Edge-safe, no Prisma)
│   │   │   └── auth.ts                   # Full NextAuth instance (PrismaAdapter)
│   │   ├── db/
│   │   │   └── prisma.ts                 # Prisma client singleton (@prisma/adapter-pg)
│   │   ├── email/
│   │   │   ├── client.ts                 # Resend client
│   │   │   └── send.ts                   # Email sending functions
│   │   ├── storage/
│   │   │   ├── client.ts                 # GCS client
│   │   │   └── upload.ts                 # File upload functions
│   │   ├── llm/
│   │   │   └── resume.ts                 # Resume parsing with Gemini
│   │   ├── jobs/
│   │   │   └── status.ts                 # Job status derivation (archive/publish → status)
│   │   ├── slug.ts                       # URL slug generation
│   │   ├── utils/
│   │   │   ├── date.ts                   # Date formatting utilities
│   │   │   └── cn.ts                     # className merger (clsx-like)
│   │   ├── webhook/
│   │   │   └── ...                       # Webhook infrastructure
│   │   └── index.ts                      # Barrel export of public lib functions
│   │
│   ├── schemas/                          # Zod validation schemas (shared)
│   │   ├── index.ts
│   │   ├── job.ts                        # Job creation/update schemas
│   │   ├── application.ts                # Job application schemas
│   │   ├── template.ts                   # Template schemas
│   │   └── settings.ts                   # Settings schemas
│   │
│   ├── types/                            # TypeScript type definitions
│   │   ├── next-auth.d.ts                # NextAuth session/user augmentations
│   │   └── globals.d.ts
│   │
│   ├── generated/                        # Generated code (gitignored)
│   │   └── prisma/                       # Prisma client output
│   │       ├── client.ts                 # @/generated/prisma/client
│   │       ├── enums.ts                  # Enums (ApplicationStatus, etc.)
│   │       └── models.ts                 # Type definitions
│   │
│   └── test/                             # Test utilities and setup
│       └── ...
│
├── prisma/                               # Prisma schema & migrations
│   ├── schema.prisma                     # Database schema
│   └── migrations/                       # Database migration files
│
├── public/                               # Static assets
│   └── ...
│
├── .github/                              # GitHub workflows
│   └── workflows/
│       └── ci.yml                        # CI pipeline (lint → typecheck → test)
│
├── .claude/                              # Claude Code configuration
│   ├── agents/                           # Agent definitions
│   ├── skills/                           # Skill library
│   └── rules/                            # Coding rules & conventions
│
├── .planning/                            # Planning documents (created by GSD)
│   └── codebase/                         # Architecture docs
│       ├── ARCHITECTURE.md
│       └── STRUCTURE.md
│
├── CLAUDE.md                             # Project instructions for Claude
├── package.json                          # pnpm dependencies
├── pnpm-lock.yaml                        # Lockfile (use pnpm, never npm)
├── tsconfig.json                         # TypeScript config (path alias @/*)
├── next.config.ts                        # Next.js config
├── components.json                       # shadcn/ui config
└── README.md                             # Project documentation
```

## Directory Purposes

**src/app:**
- Purpose: Next.js App Router routes, pages, and API handlers
- Contains: Route groups, segment directories, layout components, page components, API routes
- Route groups used: `(public)` for public content, `(admin)` for admin area with auth

**src/app/(public):**
- Purpose: Public-facing routes (no auth required)
- Contains: Landing page, careers listing, job detail + application form
- Key files: `src/app/(public)/careers/[slug]/page.tsx` (job detail)

**src/app/(admin):**
- Purpose: Admin route group (enforces ADMIN role in layout)
- Contains: Admin layout, sidebar navigation, nested `admin/` segment
- Note: Intentional double nesting `(admin)/admin/` where:
  - `(admin)` is route group controlling auth and layout
  - `admin/` is segment controlling URL prefix `/admin/*`
  - Flattening breaks URLs and requires middleware matcher update

**src/app/(admin)/admin:**
- Purpose: Admin pages with `/admin/*` URL prefix
- Contains: Dashboard, jobs CRUD, templates, settings, pipeline/applicants management

**src/components:**
- Purpose: Reusable component library
- Organization:
  - `ui/` — Unstyled shadcn/ui components
  - `admin/`, `dashboard/`, `pipeline/`, `public/` — Feature-specific components
  - Page-specific components in `_components/` co-located with page (private folder convention)

**src/server/services:**
- Purpose: Business logic encapsulation
- Organization: Domain-based (jobs, applicants, pipeline, templates)
- Pattern: Split by CRUD (`create.ts`, `read.ts`, `update.ts`, `delete.ts`)
- Barrel exports in `index.ts` for clean imports

**src/lib:**
- Purpose: Shared infrastructure and utilities
- Organization:
  - `auth/` — NextAuth configuration and instance
  - `db/` — Database connection (Prisma)
  - `email/` — Email service (Resend)
  - `storage/` — File storage (GCS)
  - `llm/` — AI services (resume parsing)
  - `jobs/` — Job-specific business rules (status derivation)
  - `utils/` — General utilities (date, className)

**src/schemas:**
- Purpose: Zod validation schemas shared between server and client
- Contains: Job creation, application submission, settings, template schemas
- Pattern: Export both schema and TypeScript type from each file

**src/types:**
- Purpose: TypeScript type augmentations and definitions
- `next-auth.d.ts` — Augments Session, User, and JWT with role and userId

**src/generated:**
- Purpose: Generated code from Prisma (gitignored, regenerated on install)
- Contents: Prisma client, enums, types
- Import: Always from `@/generated/prisma/client`, never from `@prisma/client`

**prisma/:**
- Purpose: Database schema and migrations
- schema.prisma — Single source of truth for data model
- migrations/ — Additive-only migration history (never modify/delete migrations)

## Key File Locations

**Entry Points:**
- `src/app/page.tsx` — Landing page (public, shows route map, login)
- `src/app/signin/page.tsx` — Sign in page (Google OAuth + dev login)
- `src/app/(admin)/admin/page.tsx` — Admin dashboard (ADMIN-only)
- `src/app/(public)/careers/[slug]/page.tsx` — Public job detail + application form
- `src/app/layout.tsx` — Root layout (global styles, fonts)

**Configuration:**
- `src/lib/auth/auth.config.ts` — NextAuth configuration (Edge-safe)
- `src/lib/auth/auth.ts` — Full NextAuth instance (server-only)
- `src/lib/db/prisma.ts` — Prisma client with pg.Pool adapter
- `prisma/schema.prisma` — Database schema
- `src/middleware.ts` — Request authentication and authorization

**Core Logic:**
- `src/server/services/jobs/` — Job CRUD and queries
- `src/server/services/applicants/` — Applicant operations
- `src/server/services/pipeline/` — Pipeline management
- `src/server/services/current-user.ts` — User session lookup
- `src/lib/jobs/status.ts` — Job status derivation logic

**Components & UI:**
- `src/components/ui/` — shadcn/ui primitives (button, form, input, etc.)
- `src/components/admin/` — Admin UI components
- `src/components/pipeline/` — Kanban board
- `src/components/public/` — Public ApplicationForm

**Testing:**
- `src/test/` — Test utilities (currently minimal)
- Note: Vitest is configured but no `.test.ts` or `.spec.ts` files exist yet

## Naming Conventions

**Files:**
- Page components: `page.tsx` (Next.js convention)
- Layout components: `layout.tsx` (Next.js convention)
- API routes: `route.ts` (Next.js convention)
- Private folders: `_components/`, `_lib/`, `_actions/` (Next.js convention, not exported)
- Services: `[action].ts` (create.ts, read.ts, update.ts, delete.ts)
- Components: `PascalCase.tsx` (React convention)
- Utilities: `camelCase.ts` (function files)
- Types: `camelCase.d.ts` (type definition files)

**Directories:**
- Feature/domain: `kebab-case` (e.g., `pipeline`, `job-templates`)
- Route segments: `[param]` for dynamic routes, `(group)` for route groups
- Private folders: `_prefix` (e.g., `_components`, `_lib`)

**Imports:**
- Alias: `@/*` maps to `./src/*` (set in `tsconfig.json` and `vitest.config.ts`)
- Services: `import { getJob } from "@/server/services/jobs"`
- Types: `import type { JobStatus } from "@/schemas/job"`
- Components: `import { Button } from "@/components/ui/button"`
- Prisma: `import { prisma } from "@/lib/db/prisma"` and `import type { Job } from "@/generated/prisma/client"`

## Where to Add New Code

**New Feature (Domain Module):**
- Primary code: `src/server/services/[domain]/{create,read,update,delete}.ts`
- Service barrel export: Update `src/server/services/[domain]/index.ts`
- Pages: `src/app/(admin)/admin/[domain]/*.tsx`
- Components: `src/components/[domain]/*.tsx` (feature-specific) or `src/app/(admin)/admin/[domain]/_components/*.tsx` (page-specific)
- Schemas: `src/schemas/[domain].ts`
- Tests: Co-located with service: `src/server/services/[domain]/[action].test.ts`

**New Page/Route:**
- Server Component (RSC): `src/app/(group)/[segment]/page.tsx`
- API route: `src/app/api/[path]/route.ts`
- Layout: `src/app/(group)/layout.tsx` (if new route group)
- Private components: `src/app/(group)/[segment]/_components/*.tsx`

**New Component:**
- Reusable: `src/components/[feature]/*.tsx`
- Page-specific: `src/app/(group)/[segment]/_components/*.tsx` (co-located)
- UI primitive: Use shadcn/ui generator or add to `src/components/ui/*.tsx`

**New Service Utility:**
- Shared validation: `src/schemas/[domain].ts` (Zod schema)
- Business logic: `src/lib/[domain]/*.ts` (status, rules, transformations)
- Infrastructure client: `src/lib/[service]/client.ts` or `src/lib/[service]/index.ts`

**New Type Definition:**
- Session/auth augmentation: `src/types/next-auth.d.ts` or `src/types/[domain].d.ts`
- Domain types: Export from service module or schema file

## Special Directories

**src/generated/:**
- Purpose: Prisma client and type generation output
- Generated: Yes (auto-generated by `pnpm prisma:generate`)
- Committed: No (gitignored, regenerated on postinstall)
- Never edit: All files are auto-generated by Prisma CLI
- Import from: `@/generated/prisma/client`, `@/generated/prisma/enums`

**src/server/workers/:**
- Purpose: Background job workers (pg-boss planned)
- Generated: No
- Committed: Yes (.gitkeep placeholder)
- Current state: Empty (greenfield for parse-resume, send-email, webhook-dispatch workers)
- Not wired up yet

**prisma/migrations/:**
- Purpose: Database migration history
- Generated: Yes (auto-generated by `pnpm prisma:migrate`)
- Committed: Yes (all migrations checked in)
- Discipline: Additive-only, never modify/delete existing migrations
- On schema change: Create new migration with `pnpm prisma:migrate --name <desc>`

**public/:**
- Purpose: Static assets (images, fonts, favicon)
- Generated: No
- Committed: Yes
- Next.js serving: Automatically served at `/<filename>`

**.planning/codebase/:**
- Purpose: Architecture and codebase documentation (created by GSD)
- Generated: Yes (by orchestrator on `/gsd:map-codebase`)
- Committed: Yes (reference docs, not generated code)
- Consumed by: `/gsd:plan-phase` and `/gsd:execute-phase` commands

---

*Structure analysis: 2026-05-13*
