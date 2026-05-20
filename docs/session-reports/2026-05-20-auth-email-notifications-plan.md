# Session Report: 2026-05-20 Auth Email Notifications Plan

## Goal

Plan implementation for Google auth, email verification, job-alert subscriptions, email-only notifications, and AI Engineer seed/demo data using `ridi.pillaca@gmail.com` as the test email.

## What Changed

- No code was implemented in this planning session.
- The agreed scope is job-alert subscriptions, email-only notifications, and email OTP two-step verification.
- Paid billing subscriptions are out of scope for the first pass.

## Planned Implementation

- Google auth: keep Auth.js Google provider, require Google OAuth in production, and upsert users by normalized email in `src/lib/auth/auth.ts`.
- Initial admin: assign `ADMIN` to `INITIAL_ADMIN_EMAIL=ridi.pillaca@gmail.com`.
- Two-step verification: require short-lived email OTP for admin access when the email is listed in `TWO_STEP_EMAILS`.
- Job alerts: change alerts from immediate active state to confirmed subscription before sending new-job notifications.
- Notifications: use Resend and `EmailLog` for verification emails, job alerts, application confirmations, and admin emails.
- Seed data: add an AI Engineer, Global Security job/template based on the external job post sample.

## Files To Expect

- `src/lib/auth/auth.ts`
- `src/lib/auth/auth.config.ts`
- `src/lib/email/send.ts`
- `src/server/services/job-alerts.ts`
- `src/server/services/submit-job-application-impl.ts`
- `prisma/schema.prisma`
- `prisma/seed.ts`
- `docs/*`

## Verification

Planned commands:

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm test:e2e
```

Planned manual flow:

- Sign in with Google as `ridi.pillaca@gmail.com`.
- Complete email OTP and reach `/admin`.
- Subscribe to job alerts, confirm email, publish AI Engineer job, receive notification.
- Apply with `C:\Users\a2021\OneDrive\Escritorio\2026\Toronto\RichardPillaca_RESUME.pdf`.

## Commit / Push Status

- Branch: `feat/redesign`
- Commit: Not implemented
- Push: Not pushed

## Open Issues

- P2 auth/email/notifications: plan is ready, implementation still pending.
- P2 review findings should be carried into the same implementation pass or fixed first.

## Next Agent Instructions

- Implement review findings first if they block core flows.
- Keep Prisma imports out of `auth.config.ts` because middleware uses the edge-safe config.
- Treat email OTP and job alert confirmation as server-enforced flows, not only client UI.
