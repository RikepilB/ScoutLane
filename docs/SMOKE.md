# ScoutLane Preview Smoke Checklist

Run this **on the Vercel preview URL** after the PR opens, before merging to `main`. Paste the outcomes into the PR description.

Prerequisites the user must complete first (per `docs/SETUP.md`):

- `RESEND_API_KEY` + verified `EMAIL_FROM` on a domain you control
- `AUTH_GOOGLE_ID` + `AUTH_GOOGLE_SECRET` with redirect URIs registered
- `OPENROUTER_API_KEY` (your existing key)
- A worker host (Render/Railway/Fly) running both `pnpm worker:resume` and `pnpm worker:emails` with the **same** `DATABASE_URL` as the web app
- `pnpm db:seed` run against the preview DB so the five sample jobs exist

---

## Steps

| # | Step | Pass criteria |
|---|---|---|
| 1 | Visit `/careers`. | Lists at least one published job. Hero subtitle reads "ScoutLane helps companies post jobs…". |
| 2 | Click the AI Engineer job. Submit the form with a real PDF resume and a real inbox you control. | Success state: "Application received". No errors in the dev tools console. |
| 3 | Check the applicant inbox. | Confirmation email arrives within 60s. Subject reads "Application received for AI Engineer". Names/job title rendered, no template placeholders leaked. |
| 4 | Check the admin inbox (every user with `role=ADMIN` in the org). | "New application: <name> → AI Engineer" arrives. Deep link "Open in dashboard" loads the applicant page. |
| 5 | Sign in at `/signin` with Google. Open the applicant. | Within ~2 minutes `parsingStatus` flips from PARSING to COMPLETED, education / work / skills populated. If it shows FAILED, the failure reason is human-readable. |
| 6 | In the Compose email panel pick "Shortlisted", edit subject, click Send. | Applicant inbox receives it. Toast on screen reads "Email sent to <applicant>". |
| 7 | Move applicant through stages (e.g. Screening → Interview). | Toast reads "Moved to Interview". Activity timeline updates. |
| 8 | Open `/admin/notifications`. | Three new rows for the email-delivery section, all `status=200`. Resume parsing column shows no failures (or only the deliberate failure from step 10). |
| 9 | Open `/admin/email-templates`. | Banner is green: "Sending is live". Previews render. |
| 10 | In Vercel, **temporarily** set `RESEND_API_KEY=invalid` on the preview env. Re-deploy. Submit another application. | The new applicant exists in `/admin/applicants`. `/admin/notifications` shows the send with `status=0` and the Resend error in the row. Submission did not block — the success state still showed. |
| 11 | Restore the real `RESEND_API_KEY` on the preview. Re-deploy. | Subsequent sends resume normally. |
| 12 | Tail the worker host logs (Render dashboard → Service → Logs). | Both `worker:resume` and `worker:emails` show "listening on …" at startup. No unhandled promise rejections. |

---

## Failure triage

- **Confirmation email never arrives:** check `/admin/notifications` for SKIPPED/FAILED entries; if missing entirely, the worker is down.
- **Parsing stuck on PENDING:** `worker:resume` is not connected to the same `DATABASE_URL`, or `OPENROUTER_API_KEY` is missing.
- **Google sign-in fails with `redirect_uri_mismatch`:** the preview deployment URL is not in the OAuth client's authorized redirect URIs.
- **All toasts say "Failed to send email":** `RESEND_API_KEY` exists but the domain is not verified — check `https://resend.com/domains`.

After all 12 steps pass, paste the table into the PR description with PASS/FAIL per row and merge.
