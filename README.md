# ScoutLane 🚀

> **AI-powered recruitment platform** — streamline hiring with pipeline management, AI resume parsing, and automated workflows.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org)
[![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma)](https://www.prisma.io)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql)](https://www.postgresql.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss)](https://tailwindcss.com)
[![Auth.js](https://img.shields.io/badge/Auth.js-v5-7C3AED)](https://authjs.dev)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| **Public Career Pages** | Browse and apply to jobs without creating an account |
| **Admin Dashboard** | Stats, charts, and quick links for hiring activity overview |
| **Job Management** | Create, edit, publish, archive, and close job postings |
| **Kanban Pipeline** | Drag-and-drop applicants through hiring stages |
| **AI Resume Parsing** | Auto-extract education, work history, and skills via Gemini AI |
| **Applicant Review** | Search, filter, group, and view detailed applicant profiles |
| **Custom Application Forms** | Per-job form builder with text, select, and file fields |
| **Job Templates** | Reusable templates with stages, description, and screening questions |
| **External Integrations** | Webhook dispatch on pipeline stage transitions |
| **Email Notifications** | Instant confirmation emails via Resend |
| **Role-Based Access** | ADMIN / RECRUITER / HIRING_MANAGER roles with middleware guards |
| **Team Management** | Organization settings and team member role assignment |

---

## 🛠 Tech Stack

| Category | Choice |
|----------|--------|
| **Framework** | Next.js 16 (App Router, Turbopack) |
| **Language** | TypeScript 5 (strict) |
| **Database** | PostgreSQL 16 |
| **ORM** | Prisma 7 with `@prisma/adapter-pg` |
| **Auth** | Auth.js v5 (NextAuth) — JWT strategy, Google OAuth + Dev login |
| **UI** | Tailwind CSS v4 + shadcn/ui components |
| **Forms** | react-hook-form + Zod 4 validation |
| **State** | Zustand (client) + React Server Components (server) |
| **Storage** | Google Cloud Storage |
| **Email** | Resend |
| **AI** | Google Gemini 2.5 Flash (resume parsing) |
| **Tables** | TanStack Table v8 |
| **Charts** | Recharts |
| **Drag & Drop** | @dnd-kit |
| **Queue** | pg-boss (PostgreSQL-backed, greenfield) |
| **Testing** | Vitest + React Testing Library + Playwright (configured, zero tests) |

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 22.x LTS
- **pnpm** 9+ (`npm i -g pnpm`)
- **Docker** and **Docker Compose**

### Setup

```bash
# 1. Clone
git clone https://github.com/RikepilB/ScoutLane.git
cd ScoutLane

# 2. Environment
cp .env.example .env
# Edit .env — at minimum set AUTH_SECRET and NEXT_PUBLIC_APP_URL

# 3. Start PostgreSQL
docker compose up -d

# 4. Install dependencies (auto-generates Prisma client)
pnpm install

# 5. Create tables
pnpm prisma:migrate --name init

# 6. Seed sample data
pnpm db:seed

# 7. Start dev server
pnpm dev
```

Visit **http://localhost:3000** — go to `/signin` and enter any email to log in as ADMIN.

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `DIRECT_URL` | ✅ | Direct connection for migrations |
| `AUTH_SECRET` | ✅ | Random 32-char base64 (`openssl rand -base64 32`) |
| `AUTH_GOOGLE_ID` | for OAuth | Google OAuth client ID |
| `AUTH_GOOGLE_SECRET` | for OAuth | Google OAuth client secret |
| `INITIAL_ADMIN_EMAIL` | ✅ | Admin email for first-user bootstrap |
| `NEXT_PUBLIC_APP_URL` | ✅ | Public URL of the app |
| `GCS_PROJECT_ID` | for uploads | Google Cloud project ID |
| `GCS_BUCKET` | for uploads | GCS bucket name |
| `GCS_CLIENT_EMAIL` | for uploads | GCS service account email |
| `GCS_PRIVATE_KEY` | for uploads | GCS private key |
| `GCS_PUBLIC_BASE_URL` | for uploads | Public base URL for files |
| `RESEND_API_KEY` | for email | Resend API key |
| `EMAIL_FROM` | for email | Sender email address |
| `GEMINI_API_KEY` | for AI | Google Gemini API key |

> Full reference at [`.env.example`](.env.example). Docker uses `scoutlane:scoutlane` credentials, `.env.example` defaults to `postgres:postgres` — update `.env` after copying.

---

## 📖 User Guide

### For Candidates

1. Browse published jobs on the **landing page**
2. Click any job to view details (description, location, salary, type)
3. Click "Apply now" and fill in the application form
4. Upload your resume (PDF, DOC, or DOCX, max 5MB)
5. Submit — you'll receive a **confirmation email** instantly

### For Admins

#### Dashboard (`/admin`)
Stats cards and charts showing hiring activity at a glance.

#### Jobs (`/admin/jobs`)
Create, edit, publish, archive, and manage all job postings. Filter by status (All / Active / Draft / Closed).

#### Pipeline (`/admin/jobs/[id]/pipeline`)
Kanban board for visual stage management. Drag applicant cards between columns to update their status. Every transition is logged with a timestamp and user.

#### Applicants (`/admin/jobs/[id]/applicants`)
Search by name/email, filter by status or institution, group by institution. Click any applicant to view their full profile with AI-parsed resume data, activity timeline, and admin notes.

#### Templates (`/admin/templates`)
Create reusable templates with job defaults, pipeline stages, markdown job descriptions, and structured screening questions. Use templates when creating new jobs — they're copied at creation time.

#### Integrations (`/admin/jobs/[id]/integrations`)
Connect pipeline stage transitions to external APIs. ScoutLane sends candidate data as JSON when an applicant reaches a configured stage.

#### Settings (`/admin/settings`)
Configure organization name/slug and manage team member roles.

---

## 📁 Project Structure

```
src/
├── app/
│   ├── (public)/                # Public routes (no auth)
│   ├── (admin)/                 # Admin dashboard (auth required)
│   │   └── admin/
│   │       ├── jobs/            # Job CRUD + pipeline + applicants + form + integrations
│   │       ├── templates/       # Job template management
│   │       └── settings/        # Organization + team settings
│   ├── api/                     # REST endpoints
│   └── signin/                  # Auth page
├── components/                  # React components
│   ├── ui/                      # shadcn/ui primitives
│   ├── pipeline/                # Kanban board (dnd-kit)
│   ├── public/                  # Application form
│   └── admin/                   # Job form, status badges, etc.
├── lib/
│   ├── auth/                    # Auth.js (Edge-safe config + full instance)
│   ├── db/                      # Prisma client
│   ├── email/                   # Resend email sender
│   ├── llm/                     # Gemini OpenAI wrappers
│   ├── storage/                 # Google Cloud Storage
│   └── webhook/                 # Webhook dispatch + HMAC signing
├── schemas/                     # Zod validation schemas
├── server/services/             # Server actions (business logic)
└── middleware.ts                # Auth middleware
```

**Key conventions:**
- Path alias `@/*` → `./src/*`
- Server Components by default; `"use client"` only for interactivity
- Conventional commits (`feat:`, `fix:`, `chore:`, etc.)
- shadcn/ui primitives under `src/components/ui/`

---

## 📜 Commands

| Command | Action |
|---------|--------|
| `pnpm dev` | Dev server with Turbopack on port 3000 |
| `pnpm build` | Production build |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm lint` | ESLint |
| `pnpm test` | Vitest (47 tests across 6 files, all passing) |
| `pnpm prisma:generate` | Regenerate Prisma client to `src/generated/prisma/` |
| `pnpm prisma:migrate --name <x>` | Create + apply migration |
| `pnpm prisma:deploy` | Apply pending migrations |
| `pnpm prisma:reset` | Drop + remigrate + re-seed |
| `pnpm db:seed` | Seed test data |
| `pnpm db:studio` | Prisma Studio GUI |

CI: `lint → typecheck → test → build`

---

## 🎬 Demo

A full walkthrough demo is available. Recorded with [OpenVid](https://openvid.dev) — a free, browser-based screen recording and video editing tool.

### Demo Walkthrough

| Segment | Duration | Covers |
|---------|----------|--------|
| **Public Experience** | ~1 min | Landing page, career detail, application form, confirmation email |
| **Jobs & Pipeline** | ~1.5 min | Dashboard, create job, use template, Kanban drag-and-drop |
| **Applicant Review** | ~1 min | Search/filter, parsed resume, activity timeline, notes |
| **Advanced Features** | ~1.5 min | Templates (markdown upload + questions), custom forms, integrations, settings |

---

## 🔐 Auth Notes

- **Session strategy is JWT**, not database sessions (`strategy: "jwt"`)
- **Two auth files:** `auth.config.ts` (Edge-safe, no Prisma — used by middleware) and `auth.ts` (full instance with PrismaAdapter — used by API routes and server actions)
- **Middleware** only allows `ADMIN` role for `/admin/*`; `RECRUITER` and `HIRING_MANAGER` are redirected to `/access-denied`
- **Dev login** (`NODE_ENV=development`): enter any email at `/signin` → logged in as `ADMIN`
- **Production**: configure `AUTH_GOOGLE_ID` + `AUTH_GOOGLE_SECRET` for Google OAuth; falls back to dev login if not configured

---

## 🗄 Database

- **12 models:** Organization, User, Job, Applicant, PipelineStage, StageTransition, JobTemplate, JobIntegration, IntegrationLog, Webhook, WebhookLog, Account, Session, VerificationToken
- Import Prisma client from `@/generated/prisma/client` — never from `@prisma/client`
- `src/generated/` is gitignored — rebuild with `pnpm prisma:generate`

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

MIT — see [LICENSE](LICENSE).
