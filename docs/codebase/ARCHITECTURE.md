# Architecture

**Analysis Date:** 2026-05-13

## Pattern Overview

**Overall:** Modular Monolith (Next.js App Router)

**Key Characteristics:**
- Single deployable Next.js App Router application
- Domain-organized modules (jobs, applicants, pipeline, templates, settings) co-located with domain logic
- No network boundaries between modules—all access PostgreSQL via a single Prisma client
- Thin API layer delegating to service modules
- Server Components by default with selective `"use client"` for interactivity

## Layers

**Presentation Layer (Next.js App Router):**
- Purpose: Route-based pages, layouts, and API endpoints
- Location: `src/app/`
- Contains: Page components (RSC by default), layout hierarchy, API routes
- Depends on: Services layer, components, schemas
- Used by: End users (browsers) and API clients

**Page Components & Layout (Route Groups):**
- Purpose: Handle routing and render content
- Location: `src/app/(public)/`, `src/app/(admin)/` (route groups), `src/app/(admin)/admin/*` (intentional double nesting for URL `/admin/*`)
- Contains: Server Components that orchestrate data fetching via services
- Pattern: `getCurrentUserWithOrganization()` or `getJob(id)` called directly in pages (RSC)
- Entry Points:
  - `src/app/page.tsx` (landing, public)
  - `src/app/signin/page.tsx` (auth)
  - `src/app/(admin)/admin/jobs/page.tsx` (admin jobs list)
  - `src/app/(admin)/admin/jobs/[id]/page.tsx` (job detail)
  - `src/app/(public)/careers/[slug]/page.tsx` (job application public form)

**Components Layer:**
- Purpose: Reusable UI building blocks
- Location: `src/components/`
- Contains:
  - `ui/` — shadcn/ui primitives (button, form, input, label, table, textarea)
  - `admin/` — Admin-specific components (StatusBadge, ApplicantStatusBadge, EmptyState, NewJobForm)
  - `dashboard/` — Dashboard charts and stats
  - `pipeline/` — Kanban board (KanbanBoard, KanbanColumn, ApplicantCard)
  - `public/` — Public-facing components (ApplicationForm)
- Pattern: Page-specific components go in `_components/` co-located with the page (Next.js private folder convention)

**Service Layer:**
- Purpose: Business logic encapsulation and data access orchestration
- Location: `src/server/services/`
- Contains: Modules split by CRUD operation pattern
- Modules:
  - `jobs/{create,read,update,delete}.ts` — Job CRUD
  - `applicants/{read,update}.ts` — Applicant operations
  - `pipeline/{read,update,stages}.ts` — Pipeline management
  - `templates.ts` — Job template handling
  - `settings.ts` — Organization settings
  - `applications.ts` — Public job application submission
  - `current-user.ts` — User session and organization lookup
  - `_lib/` — Shared service utilities (validate-session, error handling)
- Export Pattern: Barrel exports in `index.ts` (e.g., `src/server/services/jobs/index.ts`)
- Server-only: All services use `"use server"` directive

**Infrastructure/Shared Lib Layer:**
- Purpose: Cross-cutting infrastructure, clients, and utilities
- Location: `src/lib/`
- Contains:
  - `auth/` — NextAuth config split into two files:
    - `auth.config.ts` — Edge-safe config (NextAuthConfig), no Prisma imports, used by middleware
    - `auth.ts` — Full instance with PrismaAdapter, callbacks, provider setup
  - `db/prisma.ts` — Prisma client singleton using `@prisma/adapter-pg` over `pg.Pool`
  - `email/` — Resend email client and send functions
  - `storage/` — GCS file upload (resumeFile, file buffer)
  - `llm/` — LLM resume parsing (Gemini)
  - `jobs/status.ts` — Job status derivation (archive/publish → active/draft/closed)
  - `slug.ts` — URL slug generation for jobs
  - `utils/` — Shared utilities (date formatting, cn className merger)
  - `webhook/` — Webhook handling (infrastructure)
- Pattern: Barrel exports in `src/lib/index.ts`

**API Routes Layer:**
- Purpose: HTTP request handling (thin layer)
- Location: `src/app/api/`
- Pattern: Validate input → delegate to service → return JSON
- Key routes:
  - `api/admin/jobs/[id]/pipeline/route.ts` — Get pipeline with applicants grouped by stage
  - `api/admin/jobs/[id]/form/route.ts` — Form schema fetch (scaffold)
  - `api/admin/jobs/integrations/[integrationId]/route.ts` — Integration management
  - `api/public/jobs/[slug]/applications/route.ts` — Public job application submission
  - `api/auth/[...nextauth]/route.ts` — NextAuth handler
  - `api/health/route.ts` — Health check
- Not implemented yet: Most admin CRUD endpoints are scaffolded but missing implementation

**Middleware:**
- Purpose: Auth gateway and request routing
- Location: `src/middleware.ts`
- Responsibility: Enforce authentication, role-based access (ADMIN-only), redirect to signin
- Auth Strategy: Uses `auth()` from `auth.config.ts` (Edge-safe)
- Public paths (bypass auth):
  - `/` (landing)
  - `/signin`
  - `/api/health`
  - `/careers/**` (public job listings)
  - `/api/public/**` (public API)
  - `/access-denied`
- Admin enforcement: Any `/admin/*` or `/api/admin/*` request with role !== "ADMIN" redirects to `/access-denied`
- Note: RECRUITER and HIRING_MANAGER are valid UserRole enum values but are *blocked* from admin access

## Data Flow

**Public Job Application Flow:**

1. Browser visits `GET /careers/[slug]` (public page)
2. Page component fetches published Job via Prisma (from `src/app/(public)/careers/[slug]/page.tsx`)
3. ApplicationForm (`src/components/public/ApplicationForm.tsx`) renders with job details
4. Form submission → `POST /api/public/jobs/[slug]/applications/route.ts`
5. API route validates input (Zod schema `jobApplicationSubmissionSchema`)
6. Delegates to `applications.ts` service → `prisma.applicant.create()`
7. Sends confirmation email via Resend
8. Returns success response → redirect to `/careers/[slug]/submitted`

**Admin Job Management Flow:**

1. Admin visits `GET /admin/jobs` (authenticated RSC)
2. Middleware verifies session role is one of ADMIN / RECRUITER / HIRING_MANAGER (from `middleware.ts`)
3. Page calls `getCurrentUserWithOrganization()` service → gets user + organization
4. Page queries `prisma.job.findMany({ where: { organizationId } })`
5. Derives job status via `getJobStatus(job)` utility (archive/publish → status)
6. Renders job list with status badges
7. Click "View" → `GET /admin/jobs/[id]` page
8. Page calls `getJob(id)` service (from `src/server/services/jobs/read.ts`)
9. Returns job with stages and applicant count
10. Page renders job detail page

**Pipeline View Flow:**

1. Admin visits `GET /admin/jobs/[id]/pipeline` (page)
2. Page fetches pipeline via `GET /api/admin/jobs/[id]/pipeline/route.ts`
3. API route queries stages + applicants, groups applicants by `stage.name.toUpperCase()` → `ApplicationStatus` enum match
4. Returns JSON: `[ { id, name, color, order, applicants: [] }, ... ]`
5. KanbanBoard (`src/components/pipeline/KanbanBoard.tsx`) renders columns with cards
6. Applicant cards fetch detail on click

**State Management:**
- Sessions: JWT-based (NextAuth strategy: "jwt"), no database sessions
- Data: Prisma as single source of truth, no client state management for models
- Cache: Next.js ISR/revalidation on mutations (services call `revalidatePath()`)

## Key Abstractions

**Service Module (Barrel Export Pattern):**
- Purpose: Encapsulate domain CRUD + business logic
- Examples: `src/server/services/jobs/index.ts`, `src/server/services/applicants/index.ts`
- Pattern:
  ```typescript
  // src/server/services/jobs/index.ts
  export { createJob } from "./create";
  export { getJob } from "./read";
  export { updateJob } from "./update";
  export { deleteJob } from "./delete";
  ```
- All services are server-only (`"use server"`)

**Job Status Derivation (Computed Property):**
- Purpose: Derive status from `published` and `archived` boolean columns
- Location: `src/lib/jobs/status.ts`
- Pattern: Functions read `JobStatusRecord` (archive/publish) → return `JobStatus` (active/draft/closed)
- Rationale: Status is derived, not stored—easier to modify rules without migration
- Usage: Pages call `getJobStatus(job)` after fetching

**Pipeline ↔ Status Coupling:**
- Purpose: Group applicants by pipeline stage
- Implementation: `src/app/api/admin/jobs/[id]/pipeline/route.ts`
- Pattern: Match `stage.name.toUpperCase()` against `ApplicationStatus` enum (`NEW`, `REVIEWING`, `SHORTLISTED`, `INTERVIEW`, `OFFERED`, `REJECTED`, `WITHDRAWN`)
- Limitation: Seed creates stages named "New / Screening / ..." but only "NEW" and "INTERVIEW" match enum—others produce empty columns silently
- Future: Decouple stage names from enum values (more flexible)

**Prisma Client Singleton with Adapter:**
- Purpose: Database connection pooling and query execution
- Location: `src/lib/db/prisma.ts`
- Pattern:
  ```typescript
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  export const prisma = new PrismaClient({ adapter });
  ```
- Import: Always from `@/generated/prisma/client` (not `@prisma/client`)
- Lifetime: Singleton, reused across requests in serverless environment

**Auth Split (Edge-Safe vs Full Instance):**
- Purpose: Use Edge-compatible config in middleware, full instance with Prisma elsewhere
- Config (`auth.config.ts`):
  - NextAuthConfig type (no implementation)
  - Google + dev Credentials providers
  - JWT session strategy
  - Callbacks for jwt/session transformation (add role, userId)
  - Can be used in Edge runtime (middleware)
- Instance (`auth.ts`):
  - Full NextAuth instance with PrismaAdapter
  - signIn callback for user upsert logic (INITIAL_ADMIN_EMAIL setup)
  - Used by page components, services, and API routes
  - Cannot be used in Edge runtime

**Zod Schema Shared:**
- Purpose: Single source of truth for validation
- Location: `src/schemas/`
- Pattern: Exported as both schemas and TypeScript types
- Usage: Server-side (form action validation) and client-side (form library)
- Examples:
  - `jobCreationSchema` — Job create/update form
  - `jobApplicationSubmissionSchema` — Public job application
  - `settingsSchema` — Settings form

## Entry Points

**Landing Page:**
- Location: `src/app/page.tsx`
- Triggers: Browser visit to `/`
- Responsibilities: Display marketing copy, login button, route map for dev, list published jobs
- Public, no auth required

**Sign In Page:**
- Location: `src/app/signin/page.tsx`
- Triggers: Middleware redirect or user click
- Responsibilities: Render Google OAuth + dev login form (dev-only Credentials provider)
- Public, no auth required

**Admin Dashboard:**
- Location: `src/app/(admin)/admin/page.tsx`
- Triggers: Authenticated workspace member visit to `/admin`
- Responsibilities: Display stats (jobs, applicants, pipeline activity)
- Protected: ADMIN / RECRUITER / HIRING_MANAGER (`middleware.ts`); granular admin-only actions enforced in server code

**Jobs List:**
- Location: `src/app/(admin)/admin/jobs/page.tsx`
- Triggers: Authenticated workspace member visit to `/admin/jobs`
- Responsibilities: Fetch + render jobs, filter by status, link to detail/create
- Protected: Same workspace roles via middleware

**Job Detail:**
- Location: `src/app/(admin)/admin/jobs/[id]/page.tsx`
- Triggers: Authenticated workspace member opens a job
- Responsibilities: Render job metadata, navigation tabs (overview, applicants, pipeline, stages, integrations)
- Protected: Same workspace roles via middleware

**Public Careers Page (Single Job):**
- Location: `src/app/(public)/careers/[slug]/page.tsx`
- Triggers: Any visitor (no auth required) to `/careers/[slug]`
- Responsibilities: Fetch published job by slug, render job details, ApplicationForm
- Public

**Public Application Submission Endpoint:**
- Location: `src/app/api/public/jobs/[slug]/applications/route.ts`
- Triggers: Form POST from ApplicationForm
- Responsibilities: Validate submission, create applicant, send confirmation email
- Public

## Error Handling

**Strategy:** Explicit error handling at system boundaries

**Patterns:**
- Service layer catches Prisma errors, returns error objects with messages
- API routes return JSON error responses (not thrown exceptions)
- RSC pages use try-catch or optional chaining to handle missing data
- Zod schema validation returns `safeParse()` result with issue details
- User-facing errors in UI (toast, inline validation)
- Server-side errors logged for debugging

**Examples:**
- `requireSession()` in `src/server/services/_lib/validate-session.ts` throws on missing auth/organization
- `createJob()` returns `{ success: false, error: string }` on validation/auth failure
- `getJob(id)` returns `Job | null` on missing record

## Cross-Cutting Concerns

**Logging:** Console.log patterns (no structured logging configured yet)
- Server actions and services log to stdout
- Client components should avoid logging (no console.log in production)

**Validation:** Zod schema-based
- Server-side: All form actions validate with Zod before processing
- Client-side: Form library (react-hook-form) validates using same schema
- Shared: Single schema definition in `src/schemas/`

**Authentication:** NextAuth v5 (beta) with JWT
- Session strategy: JWT (not database sessions)
- Providers: Google OAuth + dev Credentials (dev-only)
- Role injection: Callbacks add role + userId to JWT and Session
- Augmented types: `src/types/next-auth.d.ts` extends Session with id and role

**Authorization:** Middleware + page-level checks
- Middleware enforces ADMIN-only access to `/admin/*` and `/api/admin/*`
- Pages call `requireSession()` or check `session?.user?.role` explicitly
- Services can throw on missing organization (implicit org ownership check)

**Multi-tenancy:** Organization-scoped queries
- All models have `organizationId` (implicit or explicit)
- Services filter queries by `organizationId` from current user
- No explicit tenant isolation at DB level—relies on query filtering
- Auto-create fallback org in `getCurrentUserWithOrganization()` if missing

---

*Architecture analysis: 2026-05-13*
