# Technology Stack

**Analysis Date:** 2026-05-13

## Languages

**Primary:**
- TypeScript 6.0.2 - All source code (src/)
- JavaScript - Build configuration and tooling

**Secondary:**
- SQL - PostgreSQL schema via Prisma migrations

## Runtime

**Environment:**
- Node.js (target ES2022)
- Next.js 15.5.16 (App Router, Server Components by default)

**Package Manager:**
- pnpm (lockfile: `pnpm-lock.yaml`)
- Lockfile: present, committed

## Frameworks & Core Libraries

**Frontend:**
- React 19.2.5 - UI components
- Next.js 15.5.16 - App Router, Server Components, middleware, API routes
- Tailwind CSS 4.2.3 - Utility-first CSS (with @tailwindcss/postcss plugin)
- @tailwindcss/postcss 4.2.3 - PostCSS integration for Tailwind v4

**Backend/API:**
- NextAuth v5.0.0-beta.30 - Authentication (JWT sessions, OAuth, database session support)
  - @auth/prisma-adapter 2.11.2 - Prisma adapter for NextAuth
- Prisma ORM 7.7.0 - Type-safe database client
  - @prisma/adapter-pg 7.7.0 - PostgreSQL adapter using pg.Pool
- pg 8.19.0 - PostgreSQL client (low-level driver)

**Testing:**
- Vitest 4.1.4 - Test runner (jsdom, globals)
- @testing-library/react 16.3.1 - React component testing
- @testing-library/jest-dom 6.9.0 - DOM matchers
- @playwright/test 1.59.0 - E2E testing framework

**Build & Development:**
- TypeScript 6.0.2 - Type checking
- ESLint 9.39.3 - Linting
  - eslint-config-next 16.2.5 - Next.js config
  - typescript-eslint 8.59.3 - TypeScript support
- Prettier 3.8.2 - Code formatting
- PostCSS 8.5.13 - CSS processing
- tsx 4.20.6 - TypeScript execution for Prisma seed

## Key Dependencies

**Critical:**
- @prisma/client 7.7.0 - Type-safe database access
- next-auth 5.0.0-beta.30 - Authentication and session management
- zod 4.4.2 - Runtime schema validation

**UI Components & Forms:**
- @radix-ui/* (various versions) - Headless UI component primitives
  - react-avatar, react-checkbox, react-dialog, react-dropdown-menu, react-label, react-popover, react-select, react-slot, react-tabs, react-tooltip
- react-hook-form 7.74.0 - Form state management
- @hookform/resolvers 5.2.1 - Form validation resolver
- class-variance-authority 0.7.1 - Component class composition
- clsx 2.1.1 - Conditional className utility
- tailwind-merge 3.5.0 - Tailwind class merging

**Data & Tables:**
- @tanstack/react-table 8.21.2 - Headless table library
- recharts 3.8.0 - React charting library
- zustand 5.0.13 - Lightweight state management

**File Storage & LLM:**
- @google-cloud/storage 7.19.0 - Google Cloud Storage SDK
- @google/generative-ai 0.24.0 - Google Gemini API client

**Email & Communication:**
- resend 6.12.2 - Transactional email service

**Background Jobs:**
- pg-boss 12.18.1 - PostgreSQL-based job queue (wired in serverExternalPackages, not actively used)

**UI & UX:**
- lucide-react 1.14.0 - Icon library (180+ icons)
- sonner 2.0.7 - Toast notifications
- next-themes 0.4.6 - Theme provider (light/dark mode)
- date-fns 4.1.0 - Date utility library

**Drag & Drop:**
- @dnd-kit/core 6.3.0 - Headless drag-and-drop
- @dnd-kit/sortable 10.0.0 - Sortable preset
- @dnd-kit/utilities 3.2.2 - Utilities

**Utilities:**
- dotenv 17.4.1 - Environment variable loading (dev-only)
- @faker-js/faker 10.4.0 - Fake data generation (dev-only)

**Unused (in package.json but not imported):**
- @supabase/supabase-js 2.105.2 - Installed but not referenced
- openai 6.36.0 - Installed but not referenced (Gemini is used instead)

## Configuration

**Environment Variables:**
- Managed via `.env` file (example at `.env.example`)
- Database: `DATABASE_URL`
- Auth: `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `INITIAL_ADMIN_EMAIL`
- App: `NEXT_PUBLIC_APP_URL`
- Storage: `GCS_PROJECT_ID`, `GCS_BUCKET`, `GCS_CLIENT_EMAIL`, `GCS_PRIVATE_KEY`, `GCS_PUBLIC_BASE_URL`
- Email: `RESEND_API_KEY`, `EMAIL_FROM`
- LLM: `GEMINI_API_KEY`

**TypeScript Configuration:**
- `tsconfig.json` at root
- Target: ES2022
- Path alias: `@/*` → `./src/*`
- Strict mode enabled

**Tailwind Configuration:**
- Tailwind v4 with @tailwindcss/postcss plugin
- PostCSS config: `postcss.config.mjs`
- CSS entry: `src/app/globals.css` (contains @theme block)
- Base color: slate
- CSS variables enabled

**shadcn/ui Configuration:**
- Config: `components.json`
- Components at: `src/components/ui/`
- Icons: lucide-react
- Aliases configured for components, utils, hooks, lib, ui

**Vitest Configuration:**
- Config: `vitest.config.ts`
- Environment: jsdom
- Setup file: `src/test/setup.ts`
- Test files: `**/*.test.{ts,tsx}`

## Database

**Provider:** PostgreSQL (Neon in production recommended)

**Client Setup:**
- Location: `src/lib/db/prisma.ts`
- Uses pg.Pool with PrismaPg adapter
- Connection pooling for production
- Client cached globally to prevent multiple instances

**Prisma Setup:**
- Schema: `prisma/schema.prisma`
- Output: `src/generated/prisma/` (gitignored)
- Migrations: `prisma/migrations/` (additive-only discipline)
- Auto-generate on `pnpm install` via postinstall script
- Database models: User, Organization, Job, Applicant, PipelineStage, StageTransition, JobTemplate, JobIntegration, Webhook, WebhookLog, IntegrationLog, Account, Session, VerificationToken

## Platform Requirements

**Development:**
- Node.js with pnpm
- PostgreSQL database (local or remote)
- Google Cloud credentials (optional, for storage)
- Google OAuth credentials (optional, for auth)
- Resend API key (optional, for email)
- Gemini API key (optional, for resume parsing)

**Production:**
- Next.js deployment (Vercel recommended)
- PostgreSQL database (Neon recommended)
- Environment variables configured
- Google Cloud Storage for file uploads (fallback: local /api/resumes/*)

## Build & Deployment

**Scripts:**
- `pnpm dev` - Next.js dev server with Turbo, port 3000
- `pnpm build` - Production build
- `pnpm start` - Production server
- `pnpm lint` - ESLint check
- `pnpm typecheck` - TypeScript check
- `pnpm test` - Vitest (watch mode)
- `pnpm test -- --run` - Vitest (CI mode, single run)
- `pnpm test:e2e` - Playwright E2E tests

**Next.js Configuration:**
- Server external packages: `@prisma/client`, `pg-boss`
- Server actions body limit: 10mb
- Security headers: X-Frame-Options, X-Content-Type-Options, Referrer-Policy, X-XSS-Protection, Permissions-Policy

---

*Stack analysis: 2026-05-13*
