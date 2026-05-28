# ScoutLane Setup Guide

Step-by-step procurement and configuration for the integrations the app expects:

1. Resend (transactional email)
2. Google OAuth (admin sign-in)
3. OpenRouter (AI resume parsing)
4. Background workers (resume + email queues)
5. Verifying everything works locally

ScoutLane is designed so that missing integrations degrade gracefully — the app boots, applications can be submitted, and the only effect of a missing key is that the related feature (email send, Google sign-in, AI parsing) is disabled and a warning is logged.

---

## 1. Resend (transactional email)

Email is used for:

- Applicant confirmation when an application is submitted.
- Admin notification to recruiters when a new application lands (if configured).
- Editable status-change emails sent from the admin pipeline.
- Outbound messages composed from the applicant profile page.
- Job-alert subscription + new-job notifications on the public careers board.

### 1.1 Create a Resend account

1. Sign up at https://resend.com. The free tier is enough for development.
2. Confirm your email.

### 1.2 Create an API key

1. Open https://resend.com/api-keys.
2. Click **Create API key**.
3. Name it `scoutlane-dev` (or per-environment, e.g. `scoutlane-prod`).
4. Permissions: **Full access** is fine for dev; **Sending access** is enough for prod.
5. Copy the key (starts with `re_`). Resend only shows it once.

Put it in `.env`:

```
RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

### 1.3 Set the sending address (local development)

For local development without a custom domain, use Resend's shared test domain. No DNS setup is needed.

```
EMAIL_FROM="ScoutLane <onboarding@resend.dev>"
```

**Limitation:** the free tier only delivers to the email address that owns your Resend account. This is fine for local testing where you submit applications using that same email address.

### 1.4 Verify a sending domain (production)

For production, verify your own domain so emails can reach any recipient.

1. Open https://resend.com/domains.
2. Click **Add domain**, enter the domain you own (e.g. `scoutlane.com`).
3. Resend shows DNS records (SPF, DKIM, optional DMARC). Add them in your registrar's DNS panel. Propagation usually takes 5–30 minutes.
4. When all records turn green, the domain is verified.

Set `EMAIL_FROM` to an address on the verified domain:

```
EMAIL_FROM="ScoutLane <noreply@scoutlane.com>"
```

### 1.5 Behavior when not configured

If `RESEND_API_KEY` or `EMAIL_FROM` is missing the app does **not** crash. Each send attempt:

- Logs a warning to the server console.
- Writes a row to the `EmailLog` table with `status=0` and `error="SKIPPED: RESEND_API_KEY or EMAIL_FROM not configured"`.

Visit `/admin/notifications` to see skipped/failed sends.

---

## 2. Google OAuth (admin sign-in)

`/admin/*` is protected by middleware. Sign-in happens via NextAuth (Auth.js v5). Provider = Google.

When `AUTH_GOOGLE_ID` is empty the dev-only Credentials provider is enabled, so you can sign in with any email locally — but production must have Google configured.

### 2.1 Create a Google Cloud project

1. Go to https://console.cloud.google.com/.
2. Top bar → project picker → **New Project**.
3. Name it `scoutlane` (or `scoutlane-prod` / `scoutlane-dev`).

### 2.2 Configure the OAuth consent screen

1. Sidebar → **APIs & Services → OAuth consent screen**.
2. User type: **External** (for any Google account) or **Internal** (Workspace only).
3. App info:
   - App name: `ScoutLane`
   - User support email: your address
   - Developer contact: your address
4. Scopes: leave defaults (`openid`, `email`, `profile`).
5. Test users (while the app is in "Testing" mode): add the email addresses that should be able to sign in. Once the app is published anyone with a Google account can sign in.

### 2.3 Create OAuth 2.0 credentials

1. Sidebar → **APIs & Services → Credentials**.
2. **Create credentials → OAuth client ID**.
3. Application type: **Web application**.
4. Name: `ScoutLane Web` (or per-environment).
5. **Authorized JavaScript origins**:
   - `http://localhost:3000` (dev)
   - `https://your-prod-domain.com` (prod)
6. **Authorized redirect URIs** (NextAuth wires this path automatically):
   - `http://localhost:3000/api/auth/callback/google`
   - `https://your-prod-domain.com/api/auth/callback/google`
7. **Create**. Copy the **Client ID** and **Client secret**.

### 2.4 Set env vars

```
AUTH_GOOGLE_ID="123456789012-abcdefg.apps.googleusercontent.com"
AUTH_GOOGLE_SECRET="GOCSPX-xxxxxxxxxxxxxxxxxxxxx"
AUTH_SECRET="<generate with: openssl rand -base64 32>"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
INITIAL_ADMIN_EMAIL="you@example.com"
```

`INITIAL_ADMIN_EMAIL` is auto-promoted to the `ADMIN` role on first login. Everyone else lands as `RECRUITER` and can be promoted from the admin settings page.

### 2.5 Local check

```
pnpm dev
```

- Open http://localhost:3000/signin.
- Click **Sign in with Google**.
- Approve the consent screen.
- You should be redirected to `/admin`.

If you see "Error 400: redirect_uri_mismatch" the URI you used does not match what is configured in Google Cloud — re-check `NEXT_PUBLIC_APP_URL` and the redirect URIs you saved.

### 2.6 Disabling the dev provider in production

The dev Credentials provider is only registered when `NODE_ENV === "development"` OR `AUTH_GOOGLE_ID` is empty. In production, **always** set a real `AUTH_GOOGLE_ID` so the dev provider is suppressed.

---

## 3. OpenRouter (AI resume parsing)

Resume parsing uses OpenRouter through the OpenAI-compatible SDK. If `OPENROUTER_API_KEY` is missing the parser returns a graceful stub and the applicant ends in `parsingStatus="FAILED"` with the reason recorded in `data.parsingError`.

### 3.1 Get the key

1. Sign up at https://openrouter.ai/.
2. Top-right → **Keys** → **Create key**. Copy it once.

### 3.2 Set env vars

```
OPENROUTER_API_KEY="sk-or-v1-xxxxxxxxxxxxxxxxxxxx"
# Optional. Defaults to the current free OpenRouter fallback used by ScoutLane.
OPENROUTER_MODEL="openrouter/owl-alpha"
OPENROUTER_FALLBACK_MODELS="openrouter/free,openrouter/auto"
```

### 3.3 What happens when parsing fails

The applicant row is updated with `parsingStatus="FAILED"` and the error message is stored in `data.parsingError`. The retry button on the applicant detail page calls `/api/admin/jobs/parse-retry/[applicantId]` and re-runs the worker job.

---

## 4. Background workers

ScoutLane runs two long-running worker processes off the web server. They cannot run on Vercel serverless — host them on Render, Railway, Fly, or any process supervisor with persistent execution.

| Process | Command | Triggered by |
|---|---|---|
| Resume parser | `pnpm worker:resume` | New applications → `enqueueResumeParseJob` |
| Email sender | `pnpm worker:emails` | New applications, admin sends, job alerts → `enqueueEmailJob` |

Both workers share the same `DATABASE_URL` as the web app (pg-boss stores jobs in PostgreSQL). On startup they create their queues if missing and run forever.

**Resume parsing mode:** `RESUME_PARSE_MODE` controls how resume parsing runs. The default is `"queue-and-inline"` — parsing happens immediately during submission AND gets enqueued for redundancy. In production with high traffic, switch to `"queue"` to avoid blocking application submissions, and run `pnpm worker:resume` on a persistent host.

### 4.1 Local dev

With the default `RESUME_PARSE_MODE=queue-and-inline`, you only need the email worker for local dev:

```
pnpm dev
pnpm worker:emails
```

If you switch to `RESUME_PARSE_MODE=queue`, also start the resume worker:

```
pnpm worker:resume
```

### 4.2 Hosted (recommended on Render)

Create two Background Worker services on Render pointed at the same repo:

- Service 1 — Build: `pnpm install --prod=false && pnpm prisma:generate`, Start: `pnpm worker:resume`
- Service 2 — Build: `pnpm install --prod=false && pnpm prisma:generate`, Start: `pnpm worker:emails`

Environment: copy `DATABASE_URL`, `RESEND_API_KEY`, `EMAIL_FROM`, `OPENROUTER_API_KEY`, `NEXT_PUBLIC_APP_URL`, plus the storage variables in use (GCS or S3). Vercel envs do **not** propagate — set them again on the worker host.

After deploying or rotating keys, **restart both workers** so the new envs take effect.

### 4.3 What happens without the workers

- With `RESUME_PARSE_MODE=queue-and-inline` (default), parsing happens inline during submission — the resume worker is optional for redundancy only.
- With `RESUME_PARSE_MODE=queue`, `enqueueResumeParseJob` returns immediately; the row stays in `PENDING` until the resume worker picks it up.
- `enqueueEmailJob` returns immediately; admin notification and applicant confirmation emails are never sent without the email worker — the applicant submission still succeeds.

Both are visible in `/admin/notifications` (parsing failures + email skips).

---

## 5. Smoke-testing locally

After filling the keys above:

```
pnpm install
pnpm prisma:generate
pnpm prisma:migrate --name init     # only on a fresh DB
pnpm db:seed
pnpm dev
```

Then:

1. **Apply as an applicant:** open a job from http://localhost:3000, submit the form. You should receive a confirmation email at the address you used.
2. **Sign in as admin:** http://localhost:3000/signin → Google.
3. **Move an applicant through stages:** open `/admin/jobs/<id>/applicants/<applicantId>`, change status — when the editable email draft modal opens, send it.
4. **Inspect EmailLog:** `/admin/notifications` shows sends and skips.

If email sends are skipped:

- Check `RESEND_API_KEY` and `EMAIL_FROM` are present in `.env`.
- Restart `pnpm dev` after editing `.env`.
- The relevant warning will be in the dev-server console: `[email] skipping ...`.

---

## 6. Going to production

- Set every env var in your hosting provider (Vercel: Project → Settings → Environment Variables).
- Make sure `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` are set so the dev Credentials provider is disabled.
- Add the production redirect URI in Google Cloud Console before the first prod sign-in.
- Verify the Resend domain you intend to send from.
- Rotate any API key that was ever pasted into chat or committed to git.
