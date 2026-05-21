# Technology Stack

Last reviewed: 2026-05-20.

## Runtime

- Node.js app using Next.js 16.2.5 App Router.
- React 19.2.5.
- TypeScript 6.0.2 with strict checking.
- pnpm is the only package manager for this repo.
- PostgreSQL is the primary database; Prisma 7.7.0 generates the client into `src/generated/prisma`.

## Application Stack

| Area | Current Choice |
|---|---|
| Framework | Next.js 16 App Router, Server Components by default |
| UI | Tailwind CSS 4, shadcn-style primitives, Radix components |
| Auth | Auth.js / NextAuth v5 beta, JWT sessions, Google OAuth, dev credentials provider |
| ORM | Prisma 7 with `@prisma/adapter-pg` and `pg.Pool` |
| Database | PostgreSQL, Neon recommended for production |
| Queue | pg-boss 12 for durable resume parsing jobs |
| Storage | Google Cloud Storage with local/dev fallback paths |
| Email | Resend |
| AI | OpenRouter via the `openai` SDK; default model is `openrouter/auto` with configured fallbacks |
| Validation | Zod 4 |
| Forms | react-hook-form and `@hookform/resolvers` |
| Charts | Recharts |
| Tables | Hand-built tables plus current UI primitives; `@tanstack/react-table` is not in the current package set |
| Drag and drop | `@dnd-kit/*` |
| Tests | Vitest, Testing Library, Playwright |

## Important Dependencies

- `next`, `react`, `react-dom`
- `next-auth`, `@auth/prisma-adapter`
- `prisma`, `@prisma/client`, `@prisma/adapter-pg`, `pg`
- `pg-boss`
- `openai`
- `@google-cloud/storage`
- `resend`
- `pdf-parse`, `mammoth`
- `zod`, `react-hook-form`
- `@playwright/test`, `vitest`, `@testing-library/react`, `@testing-library/jest-dom`

## Scripts

| Command | Purpose |
|---|---|
| `pnpm dev` | Start Next.js dev server with Turbopack. |
| `pnpm build` | Production build using webpack. |
| `pnpm start` | Start production server. |
| `pnpm lint` | ESLint over the repo. |
| `pnpm typecheck` | `tsc --noEmit`. |
| `pnpm test` | Vitest. Use `pnpm test -- --run` for one-shot CI mode. |
| `pnpm test:e2e` | Playwright E2E suite. |
| `pnpm worker:resume` | Start pg-boss resume parsing worker. |
| `pnpm prisma:generate` | Generate Prisma client. |
| `pnpm prisma:migrate --name <name>` | Create and apply a dev migration. |
| `pnpm prisma:deploy` | Apply pending migrations in deploy-style environments. |
| `pnpm prisma:reset` | Drop, remigrate, and seed. |
| `pnpm db:seed` | Run `prisma/seed.ts`. |

## Environment Variables

Core:

- `DATABASE_URL`
- `AUTH_SECRET`
- `INITIAL_ADMIN_EMAIL`
- `NEXT_PUBLIC_APP_URL`

OAuth:

- `AUTH_GOOGLE_ID`
- `AUTH_GOOGLE_SECRET`

Storage:

- `GCS_PROJECT_ID`
- `GCS_BUCKET`
- `GCS_CLIENT_EMAIL`
- `GCS_PRIVATE_KEY`
- `GCS_PUBLIC_BASE_URL`

Email:

- `RESEND_API_KEY`
- `EMAIL_FROM`

AI:

- `OPENROUTER_API_KEY`
- `OPENROUTER_MODEL`
- `OPENROUTER_FALLBACK_MODELS`
- `OPENROUTER_APP_URL`
- `OPENROUTER_APP_TITLE`

Resume processing:

- `RESUME_PARSE_MODE` (`queue`, `inline`, or `queue-and-inline`; default is `queue`)

See [../.env.example](../.env.example) for concrete placeholders.
