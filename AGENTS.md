# ScoutLane Recruitment Platform - Agent Guidelines

## Tech Stack
- Framework: Next.js 15 (App Router)
- Language: TypeScript
- Database: PostgreSQL with Prisma ORM
- Queue: pg-boss (PostgreSQL-backed)
- Auth: Auth.js (NextAuth) v5 with Google provider
- File Storage: Supabase Storage or Cloudflare R2
- Email: Resend
- LLM: Google Gemini 2.5 Flash or OpenAI gpt-4o-mini
- UI: Tailwind CSS + shadcn/ui
- State Management: React Server Components + Client Components
- Forms: react-hook-form + Zod validation
- Tables: TanStack Table v8
- Drag & Drop: dnd-kit
- Charts: Recharts or Tremor

## Development Setup
1. Install dependencies: pnpm install
2. Setup environment: cp .env.example .env and fill required variables
3. Start database: docker compose up -d (PostgreSQL)
4. Run migrations: pnpm prisma migrate dev
5. Seed database: pnpm db:seed
6. Start dev server: pnpm dev

## Testing Commands
- Unit tests: pnpm test
- Integration tests: pnpm test (includes API route tests)
- E2E tests: pnpm test:e2e (Playwright)
- Lint: pnpm lint
- Typecheck: pnpm typecheck
- CI sequence: lint -> typecheck -> test

## Database Management
- Generate migration: pnpm prisma migrate dev --name <migration-name>
- Apply migration: pnpm prisma migrate deploy
- Studio GUI: pnpm prisma studio
- Reset database: pnpm prisma migrate reset

## Key Architectural Notes
- **Snapshot Templates**: Applying a template copies fields/questions to the job; template edits don't affect existing jobs
- **Async Parsing**: Resume processing happens in background workers after submission confirmation
- **Idempotent Webhooks**: Uses idempotency keys to prevent duplicate sends while allowing legitimate retries
- **Job-Scoped Data**: All applicant data, pipelines, and analytics are scoped to individual jobs
- **Public Pages**: Non-indexable, accessible only via direct link (/careers/{slug})

## Important File Conventions
- API Routes: src/app/api/ (REST endpoints)
- Server Actions: src/server/services/ (business logic)
- Workers: src/server/workers/ (background jobs: parse-resume, send-email, dispatch-webhook)
- Components: src/components/ (ui, dashboard, applicants, pipeline, form-builder, public)
- Lib Helpers: src/lib/ (db, auth, storage, queue, llm, webhook, email, slug, time, rate-limit)
- Schemas: src/schemas/ (Zod schemas shared client/server)
- Types: src/types/ (TypeScript types)
- Emails: src/emails/ (React Email templates)
- Prisma Schema: prisma/schema.prisma
- Migrations: prisma/migrations/
- Seed Data: prisma/seed.ts
- Public Routes: src/app/(public)/ (SSR for job pages)
- Admin Routes: src/app/(admin)/ (protected dashboard)
- Route Groups: Used for layout organization and auth boundaries

## Environment Variables (see .env.example)
- Database: DATABASE_URL
- Auth: AUTH_SECRET, AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET, INITIAL_ADMIN_EMAIL
- Storage: S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_PUBLIC_BASE_URL
- Email: RESEND_API_KEY, EMAIL_FROM
- LLM: GEMINI_API_KEY or OPENAI_API_KEY
- Jobs: INNGEST_EVENT_KEY, INNGEST_SIGNING_KEY
- Security: INTEGRATION_KEY_SECRET (32-byte base64 for AES-256)
- Observability: SENTRY_DSN
- App: APP_URL

## Deployment
- Recommended: Vercel (web) + Neon (PostgreSQL) + Cloudflare R2 (storage) + Resend (email) + Inngest (jobs)
- All services have free tiers suitable for development and demo
