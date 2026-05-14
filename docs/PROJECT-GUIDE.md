# ScoutLane — Project Guide

## Table of Contents

1. [Overview & Use Cases](#1-overview--use-cases)
2. [User Situations & Personas](#2-user-situations--personas)
3. [User Manual](#3-user-manual)
4. [Feature Inventory](#4-feature-inventory)
5. [OpenVid Demo Plan](#5-openvid-demo-plan)
6. [Architecture Reference](#6-architecture-reference)

---

## 1. Overview & Use Cases

### What is ScoutLane?

ScoutLane is an **AI-powered recruitment platform** that streamlines hiring through:
- Public career pages where candidates discover and apply to jobs
- An admin dashboard to manage jobs, applicants, and the hiring pipeline
- AI-assisted resume parsing to extract structured candidate data
- Automated email confirmations for applicants
- Custom application forms per job
- Team management with role-based access control

### Core Use Cases

| # | Use Case | Actor | Description |
|---|----------|-------|-------------|
| 1 | **Browse & Apply** | Candidate | View published job listings on the landing page, open a career detail page, and submit an application with resume upload |
| 2 | **Manage Jobs** | Admin | Create, edit, publish, archive, and delete job postings with custom descriptions and requirements |
| 3 | **Pipeline Tracking** | Admin | Visually track applicants through hiring stages via a Kanban drag-and-drop board |
| 4 | **Review Applicants** | Admin | Search, filter, and group applicants; view detailed profiles with parsed resume data |
| 5 | **Resume Parsing** | System | Automatically extract education, work history, and skills from uploaded resumes using Gemini AI |
| 6 | **Templates** | Admin | Create reusable job templates with default stages, description, and screening questions |
| 7 | **Custom Forms** | Admin | Build per-job application forms with custom fields (text, file, select, etc.) |
| 8 | **External Integrations** | Admin | Connect pipeline stage transitions to external APIs (webhook.site, ATS webhooks) |
| 9 | **Team Management** | Admin | Invite team members with roles (ADMIN, RECRUITER, HIRING_MANAGER) |
| 10 | **Notifications** | System | Send confirmation emails to applicants upon successful submission |

---

## 2. User Situations & Personas

### Personas

#### 🧑‍💼 Sarah — Hiring Manager
- **Goals:** Post jobs quickly, track pipeline progress, review candidates
- **Pain points:** Wants to reuse job templates, needs clear pipeline visibility
- **Uses:** Jobs list, Job creation, Pipeline board, Applicant detail

#### 👤 Carlos — Recruiter (RECRUITER role)
- **Goals:** Review applicants, update their status, take notes
- **Pain points:** Lots of resumes to process, needs structured data
- **Uses:** Applicant list, Applicant detail with parsed resume, Pipeline board

#### 🧑‍💻 Maria — Admin
- **Goals:** Full system control: settings, integrations, team management
- **Pain points:** Needs to customize application forms, connect external tools
- **Uses:** Settings page, Form builder, Integrations, Templates, All admin features

#### 🎓 Alex — Job Candidate
- **Goals:** Find relevant jobs, apply easily, receive confirmation
- **Pain points:** Wants a simple application process without creating an account
- **Uses:** Landing page, Career detail page, Application form

### Key User Flows

#### Flow A: Candidate Applies for a Job
```
Landing page → Browse jobs → Click job → Read description → Fill application form
→ Upload resume → Submit → Receive confirmation email
```

#### Flow B: Admin Creates and Publishes a Job
```
Login → Dashboard → Create job → Fill details (or use template) → Set status to active
→ Job appears on public careers page
```

#### Flow C: Admin Manages Pipeline
```
Open job → Pipeline tab → Drag applicant between stages → System logs transition
→ Triggers webhooks → Integrations fire
```

#### Flow D: Admin Reviews an Applicant
```
Open job → Applicants tab → Search/filter → Click applicant → View profile
→ See parsed resume → Read notes → Change status → Retry parsing if needed
```

---

## 3. User Manual

### 3.1 Getting Started

#### Accessing the App
- **Public URL:** `https://scoutlane.vercel.app`
- **Admin URL:** `https://scoutlane.vercel.app/admin`

#### Signing In
1. Navigate to `/signin`
2. **Production:** Click "Sign in with Google" to use Google OAuth
3. **Development:** Type any email in the dev login field and click "Sign in with Email" (auto-grants ADMIN role)
4. First sign-in with a Google account not in the database will auto-create the user

#### First-Time Setup
1. Set `INITIAL_ADMIN_EMAIL` in `.env` to your email
2. On first sign-in with that email, you become admin
3. Go to `/admin/settings` to configure your organization name and slug

### 3.2 Admin Dashboard (`/admin`)

The dashboard shows:
- **Stats cards:** Active jobs, Draft jobs, Total applicants, New applicants this week
- **Charts:** Stage distribution (bar chart of applicants per stage), Applicant trend (weekly submissions)
- **Quick links:** View all jobs, Create new job

### 3.3 Job Management

#### Creating a Job
1. Go to `/admin/jobs` → Click "Create job"
2. Fill in: Title, Description, Location, Type, Slug (auto-generated), Salary, Status
3. Optionally select a template to pre-fill fields
4. Click "Create job"

#### Job Statuses
| Status | Meaning | Published | Archived |
|--------|---------|-----------|----------|
| **Draft** | Not visible publicly | No | No |
| **Active** | Visible on career page, accepting applications | Yes | No |
| **Closed** | Hidden from career page | Yes | Yes |

#### Editing a Job
1. Open a job → Click "Edit" button (pencil icon)
2. Modify any field (title, description, location, type, salary, slug, status)
3. Click "Save changes"

#### Job Detail Page (`/admin/jobs/[id]`)
Tabs available:
| Tab | Description |
|-----|-------------|
| **Overview** | Job info, status badge, stage count widgets, quick actions |
| **Pipeline** | Kanban board for drag-and-drop stage transitions |
| **Stages** | Manage pipeline stages (add, rename, reorder, delete) |
| **Form** | Build a custom application form for this job |
| **Applicants** | List of all applicants with search, filter, grouping |
| **Integrations** | Connect external APIs to pipeline events |

### 3.4 Pipeline (`/admin/jobs/[id]/pipeline`)

- Columns represent each pipeline stage
- Cards represent applicants
- **Drag** an applicant card from one column to another to change their status
- Stage transitions are logged and can trigger webhooks/integrations
- Click "Refresh" to reload pipeline data
- Applicant cards show: name, institution, program, email, time in stage, score

### 3.5 Pipeline Stages (`/admin/jobs/[id]/stages`)

Default stages created per job:
```
Applied → Screening → Assessment → Interview → Offer → Hired → Rejected
```

Actions:
- **Add stage:** Enter a name, pick a color, click "Add"
- **Rename:** Click the pencil icon next to a stage
- **Reorder:** Drag the grip handle to reorder stages
- **Delete:** Click the trash icon → a modal appears asking where to move current applicants

> **Important:** When you delete a stage with applicants in it, you must select a target stage to reassign them. This is irreversible.

### 3.6 Custom Application Forms (`/admin/jobs/[id]/form`)

Build a custom form with:
- Text, Textarea, Email, Phone, Select, File upload fields
- Each field has a label, required toggle, placeholder text
- Fields appear on the public application page
- Changes are reflected immediately

### 3.7 Applicants (`/admin/jobs/[id]/applicants`)

#### List View
- **Search** by name or email
- **Filter** by status (pill buttons above the table)
- **Filter by institution** (dropdown)
- **Group by** institution or status (dropdown)
- **Sort** columns by clicking headers
- Columns: Name, Institution, Email, Status (badge), Score, Parsing status, Created date

#### Applicant Detail
Shows:
- **Header:** Name, email, phone, resume link, status badge, score
- **Resume preview:** Embedded iframe
- **Parsed data:** Education, Work Experience, Skills sections
- **Activity timeline:** Stage transitions with dates and who changed them
- **Actions:** Change status dropdown, Retry resume parsing, Admin notes editor

#### Resume Parsing
- After submission, the system attempts to parse the resume via Gemini AI
- Parsing status: PENDING → PARSING → COMPLETED or FAILED
- If failed, click "Retry parsing" to attempt again
- Parsed data includes: education (degree, institution, dates), work history (company, title, dates, description), skills

### 3.8 Templates (`/admin/templates`)

Create reusable templates to speed up job creation.

#### Creating a Template
1. Go to `/admin/templates` → Click "New template"
2. Fill in: Name, Description, Default job title, Description, Location, Type, Salary
3. Configure pipeline stages (one per line)
4. Add screening questions (structured editor with add/remove)
5. Click "Save template"

#### Using a Template
1. Go to `/admin/jobs/new` → Click "Use template" on any template
2. The form is pre-filled with template data
3. Edit as needed and create the job

> Templates are copied at creation time. Editing a template later does NOT affect jobs already created from it.

### 3.9 Integrations (`/admin/jobs/[id]/integrations`)

Connect pipeline stages to external APIs:
1. Select a pipeline stage (e.g., "Assessment")
2. Enter the endpoint URL (e.g., `https://webhook.site/xxx`)
3. Optionally set an API key for authentication
4. Toggle "Include assessment questions" to send screening questions
5. Click "Add integration"

When an applicant moves to that stage, ScoutLane sends:
```json
{
  "event": "stage_transition",
  "timestamp": "2026-...",
  "candidate": { "id": "...", "name": "...", "email": "...", "phone": "...", "resumeUrl": "..." },
  "assessment": { "title": "...", "description": "...", "questions": [...] }
}
```

### 3.10 Settings (`/admin/settings`)

- **Organization:** Edit name and slug (for the URL prefix)
- **Team Management:** View all members, change roles (ADMIN, RECRUITER, HIRING_MANAGER)

> **Role restrictions:** Only `ADMIN` role can access `/admin/*`. `RECRUITER` and `HIRING_MANAGER` are redirected to `/access-denied`.

### 3.11 Public Career Pages (`/careers/[slug]`)

- Active jobs are listed on the landing page (`/`)
- Each job has a detail page at `/careers/[slug]`
- Shows: title, location, type, salary, full description
- "Apply now" button opens the application form
- Application form includes: name, email, phone, resume upload, and any custom fields defined by the admin

---

## 4. Feature Inventory

### ✅ Implemented

| Feature | Location | Notes |
|---------|----------|-------|
| User auth (JWT) | Auth.js v5 | Google OAuth + Dev login |
| Role-based middleware | `middleware.ts` | Only ADMIN passes `/admin/*` |
| Landing page | `/page.tsx` | Lists active jobs |
| Job CRUD | `services/jobs/` | Create, read, update, delete |
| Job edit page | `/admin/jobs/[id]/edit` | Full form with status mapping |
| Pipeline stages CRUD | `services/pipeline/stages.ts` | Add, rename, reorder, delete |
| Stage delete with reassignment | `StagesManager.tsx` | Modal with target stage selector |
| Kanban board | `components/pipeline/` | Drag-and-drop via dnd-kit |
| Pipeline refresh | `/pipeline/page.tsx` | Refresh button |
| Institution/program on cards | `ApplicantCard.tsx` | From applicant data field |
| Applicant list | `applicants/page.tsx` | Search, filter, group, sort |
| Applicant detail | `applicants/[applicantId]` | Resume preview, parsed data, timeline, notes |
| Resume parsing | LLM + `/parse-retry` | Gemini AI extracts education/work/skills |
| Email notifications | `lib/email/send.ts` | Confirmation via Resend |
| Templates CRUD | `services/templates.ts` | Create, read, update, delete |
| Template file upload | `TemplateEditor.tsx` | .md file + preview toggle |
| Structured questions editor | `QuestionsEditor.tsx` | Per-question add/remove |
| Delete button in template list | `templates/page.tsx` | Per-row trash button |
| Custom application forms | `/form/page.tsx` | Field builder per job |
| External integrations | `services/pipeline/update.ts` | Webhook dispatch on stage change |
| Settings | `/admin/settings` | Org name, team roles |
| Stage transitions log | Prisma `StageTransition` | Full audit trail |
| Webhooks | `lib/webhook/` | Dispatch + signature + logging |
| Dashboard | `/admin/page.tsx` | Stats + charts |
| Error handling | Zod schemas + error boundaries | Validation, retry buttons |
| Access denied page | `/access-denied` | For unauthorized roles |

### 🚧 Not Yet Implemented / Planned

| Feature | Priority | Notes |
|---------|----------|-------|
| Worker processes (pg-boss) | Medium | `src/server/workers/` is greenfield — resume parsing, email, webhook dispatch |
| Admin REST API endpoints | Low | Only pipeline endpoint is wired; others scaffolded |
| Test coverage | Medium | Vitest configured, zero test files exist |
| E2E tests | Low | Playwright configured, no tests |
| Database sessions | Low | Session model exists but unused (JWT strategy in use) |
| Applicant withdrawal flow | Low | No self-service withdrawal for candidates |
| Batch operations | Low | Bulk status change, bulk email |
| Reports & analytics | Medium | Extended charts, export to CSV |
| Email templates customization | Low | HTML hardcoded in `send.ts` |

---

## 5. OpenVid Demo Plan

### Tool
[OpenVid](https://openvid.dev) — free, browser-based screen recording and video editing tool.

### Demo Script (target: ~5 minutes)

#### Segment 1: Public Experience (0:00–1:00)
| Time | Scene | Audio |
|------|-------|-------|
| 0:00 | **Landing page** — browse published jobs | "ScoutLane lets candidates browse and apply to jobs without creating an account." |
| 0:15 | **Career detail** — click a job, show description, salary, location | "Each job has a full detail page with all the info a candidate needs." |
| 0:30 | **Application form** — fill name, email, upload resume | "The application form captures resume and any custom fields the hiring team configured." |
| 0:45 | **Submit** — show success, then check email for confirmation | "After submitting, the candidate gets an instant confirmation email." |

#### Segment 2: Admin — Jobs & Pipeline (1:00–2:30)
| Time | Scene | Audio |
|------|-------|-------|
| 1:00 | **Sign in** (Dev login) | "Admins sign in with Google OAuth or dev login in development." |
| 1:10 | **Dashboard** — stats cards, charts | "The dashboard gives an at-a-glance view of all hiring activity." |
| 1:20 | **Create job** — show form with fields | "Creating a job is straightforward — title, description, location, type." |
| 1:35 | **Use template** — pick a template, show pre-filled form | "Or start from a saved template to reuse common settings." |
| 1:50 | **Pipeline board** — drag applicant between stages | "The Kanban pipeline makes it visual to move candidates through the hiring process." |
| 2:15 | **Stage transitions** — show the log in applicant detail | "Every stage change is logged for a full audit trail." |

#### Segment 3: Applicant Review (2:30–3:30)
| Time | Scene | Audio |
|------|-------|-------|
| 2:30 | **Applicant list** — search, filter by status/institution, group | "The applicant list supports search, status filters, institution filtering, and grouping." |
| 2:45 | **Applicant detail** — show parsed resume data | "AI-powered resume parsing extracts education, work history, and skills automatically." |
| 3:00 | **Activity timeline** — show stage transitions | "The activity timeline shows every status change and who made it." |
| 3:15 | **Add notes** — type and save note | "Admins can add private notes to any applicant." |

#### Segment 4: Advanced Features (3:30–5:00)
| Time | Scene | Audio |
|------|-------|-------|
| 3:30 | **Templates** — show template list, edit template with questions | "Templates save time by pre-filling job details and screening questions." |
| 3:45 | **Template editor** — upload markdown, preview, structured questions | "You can upload a markdown job description and organize screening questions." |
| 4:00 | **Custom form builder** — add fields to application form | "Each job can have a custom application form with text, select, and file fields." |
| 4:15 | **Integration** — add webhook.site endpoint | "Pipeline transitions can trigger external APIs for ATS integration." |
| 4:30 | **Settings** — org settings, team management | "Manage your organization and team roles from the settings page." |
| 4:45 | **Wrap** — show road ahead | "ScoutLane is continuously evolving — background workers, analytics, and more coming." |

### Tech Setup
1. Open ScoutLane dev server at `http://localhost:3000`
2. Open browser in incognito for candidate segments
3. Prepare test data: seed DB, create a few applicants with varied statuses
4. Record screen + microphone at 1080p
5. Edit in OpenVid: trim, add transitions, export as MP4

---

## 6. Architecture Reference

### Directory Structure

```
src/
├── app/                      # Next.js App Router pages
│   ├── (public)/             # Public routes (careers, landing)
│   ├── (admin)/              # Admin dashboard routes
│   ├── api/                  # API routes
│   └── signin/               # Auth page
├── components/               # React components
│   ├── ui/                   # shadcn/ui primitives
│   ├── pipeline/             # Kanban board
│   ├── public/               # Public-facing components
│   ├── admin/                # Admin-specific components
│   └── dashboard/            # Dashboard widgets
├── lib/                      # Utilities and configs
│   ├── auth/                 # Auth.js config (Edge-safe + full instance)
│   ├── db/                   # Prisma client singleton
│   ├── email/                # Resend email sending
│   ├── llm/                  # Gemini/OpenAI wrappers
│   ├── storage/              # GCS file upload
│   ├── webhook/              # Webhook dispatch + signing
│   └── utils/                # cn(), date formatting
├── schemas/                  # Zod validation schemas
├── server/
│   ├── services/             # Server actions (business logic)
│   └── workers/              # pg-boss handlers (greenfield)
└── middleware.ts             # Auth middleware (Edge Runtime)
```

### Key Architecture Decisions

| Decision | Implementation |
|----------|---------------|
| **Rendering** | Server Components by default, `"use client"` only for interactivity (forms, dnd, charts) |
| **Data fetching** | Admin pages call services directly (RSC), not via fetch. Pipeline uses API for real-time data. |
| **Auth** | Two files: `auth.config.ts` (Edge-safe, for middleware) and `auth.ts` (full instance with Prisma) |
| **Session** | JWT strategy with 7-day maxAge, 24h updateAge |
| **Job status** | Derived: `published && !archived = active`, `!published = draft`, `archived = closed` |
| **Pipeline mapping** | `Applicant.pipelineStageId` FK is the source of truth (post-E3). `ApplicationStatus` enum is derived from stage name via `stageNameToStatus` map in `services/pipeline/update.ts` |
| **Storage** | Google Cloud Storage (`@google-cloud/storage`) with env-configured bucket |
| **Email** | Resend with HTML templates, failure logging via try/catch |
| **Prisma** | Client at `@/generated/prisma/client` (never from `@prisma/client`), driver adapter over `pg.Pool` |

### Data Model Relationships

```
Organization
  ├── User (ADMIN, RECRUITER, HIRING_MANAGER)
  │     ├── Account (NextAuth OAuth accounts)
  │     └── Session (unused — JWT strategy)
  └── Job
        ├── Applicant (status: NEW→REVIEWING→SHORTLISTED→INTERVIEW→OFFERED→REJECTED→WITHDRAWN)
        │     └── StageTransition (audit log of status changes)
        ├── PipelineStage (name, order, color)
        ├── JobTemplate (copied at job creation, not linked)
        ├── JobIntegration (external API connections per stage)
        └── Webhook (event-based HTTP callbacks)
              └── WebhookLog (dispatch records)
```
