# External Integrations

**Analysis Date:** 2026-05-13

## APIs & External Services

**Authentication:**
- Google OAuth 2.0 (optional production provider)
  - SDK: NextAuth v5
  - Env vars: `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`
  - Config: `src/lib/auth/auth.config.ts`

**LLM & AI:**
- Google Gemini API (resume parsing)
  - SDK: @google/generative-ai 0.24.0
  - Model: gemini-2.5-flash
  - Client: `src/lib/llm/client.ts`
  - Resume parser: `src/lib/llm/resume.ts`
  - Env var: `GEMINI_API_KEY`
  - Optional - gracefully degrades to stub if not configured

**Email:**
- Resend (transactional email)
  - SDK: resend 6.12.2
  - Client: `src/lib/email/client.ts`
  - Env vars: `RESEND_API_KEY`, `EMAIL_FROM`
  - Configuration example: `src/lib/email/send.ts`

## Data Storage

**Databases:**
- PostgreSQL
  - Provider: Neon (recommended for production) or standard PostgreSQL
  - Connection: env var `DATABASE_URL`
  - Client: Prisma ORM 7.7.0 with @prisma/adapter-pg
  - Connection pooling: pg.Pool (8.19.0)
  - Schema: `prisma/schema.prisma`
  - Location: `src/lib/db/prisma.ts`

**File Storage:**
- Google Cloud Storage (primary)
  - SDK: @google-cloud/storage 7.19.0
  - Client: `src/lib/storage/client.ts`
  - Upload handler: `src/lib/storage/upload.ts`
  - Bucket: env var `GCS_BUCKET`
  - Service account credentials: `GCS_PROJECT_ID`, `GCS_CLIENT_EMAIL`, `GCS_PRIVATE_KEY`
  - Public URL config: `GCS_PUBLIC_BASE_URL` (optional, falls back to storage.googleapis.com)
  - Files stored with structure: `{prefix}/{YYYY-MM}/{slugified-filename}-{uuid}.{ext}`
  - Fallback: Local API endpoint `/api/resumes/{objectName}` when GCS not configured (dev mode)

**Caching:**
- None detected (no Redis, Memcached)
- Session management via NextAuth JWT in localStorage/cookies

## Authentication & Identity

**Auth Provider:**
- NextAuth v5.0.0-beta.30 (currently beta)
- Config: `src/lib/auth/auth.config.ts` (Edge-safe, no Prisma)
- Full instance: `src/lib/auth/auth.ts` (includes PrismaAdapter, database callbacks)

**Session Strategy:**
- JWT (not database sessions)
- Max age: 7 days
- Update age: 1 day
- Session token stored in secure HTTP-only cookie (NextAuth default)

**Auth Providers Configured:**
1. Google OAuth 2.0 (production)
2. Credentials provider (development only, when `NODE_ENV === "development"` or `!AUTH_GOOGLE_ID`)
   - Provider ID: `"dev"`
   - Dev login form at home page
   - Auto-grants `ADMIN` role for any email

**Adapter:**
- PrismaAdapter (@auth/prisma-adapter 2.11.2)
- Models used: Account, Session, VerificationToken, User
- Database-backed OAuth state and account linking

**Role System:**
- Roles: `ADMIN`, `RECRUITER`, `HIRING_MANAGER`
- Assigned at sign-in: token callback in `src/lib/auth/auth.ts`
- Initial admin: env var `INITIAL_ADMIN_EMAIL` gets `ADMIN` role on first login
- Default role: `RECRUITER`
- Persisted in: JWT token, Prisma User.role

**Middleware:**
- Location: `src/middleware.ts`
- Stricter than public docs: `/admin/*` and `/api/admin/*` require `ADMIN` role (others redirected to `/access-denied`)
- Public paths: `/`, `/signin`, `/access-denied`, `/api/health`, `/careers/**`, `/api/public/**`

## Monitoring & Observability

**Error Tracking:**
- None detected (no Sentry, DataDog, etc.)

**Logging:**
- Prisma: minimal log level set to `["error"]` in `src/lib/db/prisma.ts`
- Application: no centralized logging configured
- Console usage: not detected in critical paths

**Job Logging:**
- IntegrationLog and WebhookLog models in schema track external dispatch attempts
- Location: `src/lib/webhook/dispatch.ts` (creates WebhookLog entries for success/failure)

## CI/CD & Deployment

**Hosting:**
- Next.js compatible deployment (Vercel recommended)
- Docker-ready via `pnpm build` and `pnpm start`

**CI Pipeline:**
- GitHub Actions workflow: `.github/workflows/ci.yml` (implied)
- Sequence: `lint → typecheck → test` (per CLAUDE.md)
- Tests: Vitest (not yet populated with test files)

**Build Artifacts:**
- Prisma client auto-generated to `src/generated/prisma/` on install
- Server external packages: `@prisma/client`, `pg-boss` not bundled by Next.js

## Environment Configuration

**Required env vars (core):**
- `DATABASE_URL` - PostgreSQL connection string
- `AUTH_SECRET` - NextAuth session secret (generate: `openssl rand -base64 32`)
- `NEXT_PUBLIC_APP_URL` - Public URL for email links, OAuth redirects

**Optional but recommended:**
- `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` - Google OAuth (disables dev Credentials provider when set)
- `INITIAL_ADMIN_EMAIL` - First admin email (grants ADMIN role on sign-in)

**File storage (optional):**
- `GCS_PROJECT_ID`, `GCS_BUCKET`, `GCS_CLIENT_EMAIL`, `GCS_PRIVATE_KEY`, `GCS_PUBLIC_BASE_URL`
- Falls back to local dev API if not set

**Email (optional):**
- `RESEND_API_KEY`, `EMAIL_FROM`
- Required for sending transactional emails

**LLM (optional):**
- `GEMINI_API_KEY`
- Resume parsing works without it (stub mode)

**Secrets location:**
- `.env` file (git-ignored, never committed)
- Production: environment variable injection at deployment time

## Webhooks & Callbacks

**Incoming Webhooks:**
- Model: `Webhook` in schema
- Dispatch: `src/lib/webhook/dispatch.ts`
- Signature: HMAC signature header `X-Webhook-Signature` (see `src/lib/webhook/sign.ts`)
- Logging: WebhookLog stores request, response, status, timestamp

**Outgoing (External APIs):**
- Email via Resend API
- Resume parsing via Gemini API
- File uploads via Google Cloud Storage API

**Integration Webhooks (Job Integrations):**
- Model: `JobIntegration` in schema
- Endpoint: `src/app/api/admin/jobs/[id]/pipeline/route.ts` (scaffolded, limited implementation)
- Logs: IntegrationLog tracks dispatch attempts

## Data Exports

**Supported Models for Export:**
- Applicant with parsed resume data
- Job with pipeline stages and applicants
- Job integrations with endpoint and API key

**No formal export API yet:**
- Admin UI scaffolded but API endpoints mostly stubbed
- Direct Prisma queries in RSCs (Server Components) for now

## Third-Party Packages Status

**Installed but unused:**
- @supabase/supabase-js 2.105.2 - Not imported anywhere
- openai 6.36.0 - Not used (Gemini is preferred)

**Planned but not implemented:**
- pg-boss 12.18.1 - Background workers for resume parsing, email, webhook dispatch (workers dir is .gitkeep only)

---

*Integration audit: 2026-05-13*
