# External Integrations

Last reviewed: 2026-05-20.

## Authentication

ScoutLane uses Auth.js / NextAuth v5.

- Google OAuth is the production provider.
- Development credentials provider is available when `NODE_ENV === "development"` or Google OAuth is not configured.
- JWT sessions carry `user.id` and `user.role`.
- `INITIAL_ADMIN_EMAIL` promotes the first configured admin during sign-in.

Relevant files:

- `src/lib/auth/auth.config.ts`
- `src/lib/auth/auth.ts`
- `src/middleware.ts`

## Database

PostgreSQL is accessed through Prisma 7 and the `@prisma/adapter-pg` driver adapter over `pg.Pool`.

- Schema: `prisma/schema.prisma`
- Client singleton: `src/lib/db/prisma.ts`
- Generated client: `src/generated/prisma/`
- Production recommendation: Neon or equivalent managed Postgres

The pg-boss queue stores its metadata in the same Postgres database.

## Resume AI

The current AI provider path is OpenRouter through the `openai` SDK.

- Client: `src/lib/llm/openrouter.ts`
- Parser: `src/lib/llm/resume.ts`
- Default model: `openrouter/auto`
- Key env var: `OPENROUTER_API_KEY`
- Optional model env vars: `OPENROUTER_MODEL`, `OPENROUTER_FALLBACK_MODELS`

The parser and match scorer first try JSON mode, then retry the same model without `response_format` before moving to the next fallback model. This protects the app from provider/model combinations that reject JSON mode.

If `OPENROUTER_API_KEY` is missing, parsing degrades to a structured stub instead of crashing the application path.

## File Storage

Primary production storage can be Google Cloud Storage or S3-compatible object storage.

- Upload helper: `src/lib/storage/upload.ts`
- Client: `src/lib/storage/client.ts`
- GCS env vars: `GCS_PROJECT_ID`, `GCS_BUCKET`, `GCS_CLIENT_EMAIL`, `GCS_PRIVATE_KEY`
- Optional public URL override: `GCS_PUBLIC_BASE_URL`
- S3-compatible env vars: `S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_PUBLIC_BASE_URL`
- Optional S3 region: `S3_REGION` (defaults to `auto` for R2-style providers)
- If neither object-store provider is configured in production, resumes are persisted in the `ResumeFile` table and served from `/api/resumes/*`.
- Local development falls back to `.data/resumes` and serves files from `/api/resumes/*`.

## Email

Transactional email uses Resend.

- Client: `src/lib/email/client.ts`
- Send helper: `src/lib/email/send.ts`
- Env vars: `RESEND_API_KEY`, `EMAIL_FROM`
- Email outcomes are recorded in `EmailLog`.

## Queue and Worker

Resume parsing is durable and async.

- Queue module: `src/server/queues/resume.ts`
- Worker entrypoint: `src/server/workers/resume.ts`
- Command: `pnpm worker:resume`
- Queue name: `resume.parse`
- Retry behavior: 3 attempts, 30 second retry delay, 300 second expiry
- Default submission mode is queued parsing. Vercel deployments without a separate worker should set `RESUME_PARSE_MODE=inline` or use the admin "Parse now" action.

## Webhooks

ScoutLane has two outbound HTTP mechanisms.

Organization-wide webhooks:

- Model: `Webhook`
- Dispatcher: `src/lib/webhook/dispatch.ts`
- Signature helper: `src/lib/webhook/sign.ts`
- Audit table: `WebhookLog`
- Event example: `applicant.status_changed`

Per-stage job integrations:

- Model: `JobIntegration`
- Triggered when an applicant lands on a configured pipeline stage.
- Audit table: `IntegrationLog`
- Optional `Authorization: Bearer <apiKey>` header.
- Optional inclusion of job assessment questions.
- Idempotency uses `IntegrationLog.stageTransitionId`.

## Monitoring Gaps

There is no dedicated Sentry, Datadog, OpenTelemetry, or metrics provider wired yet. Current operational visibility is mostly database logs, application console output, `EmailLog`, `WebhookLog`, and `IntegrationLog`.
