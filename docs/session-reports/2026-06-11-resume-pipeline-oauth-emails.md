# 2026-06-11 — Resume pipeline, OAuth, emails, MCP cleanup

## Goal

"fix mcp, connect to composio … fix scoutlane in the parsing whenever i upload a pdf it does not parse correctly … preferable gemini 2.5 flash … word is not embed, pdf is embeded, word cna be download, but pdf not found. The embeed needs fixing, then the login with my google email … fix the bugs with notifications and setting up the emails directly for people onces they submit their application."

## What landed (PR #89, branch `fix/resume-pipeline-and-notifications`)

- `5ae6980` fix(resume): pdf-parse via dynamic import compatible with Next bundling (+ committed PDF fixture, un-skipped test)
- `133fa2d` chore: .gitattributes marking binary assets (prevents fixture corruption)
- `8d8d3a4` feat(llm): default model `google/gemini-2.5-flash` + fallbacks, tightened prompt
- (storage) feat(resumes): shared disk→DB resolution, Content-Disposition, clearer 404
- (preview) feat(resumes): DOCX→sanitized-HTML inline preview, authenticated route, sandboxed iframe
- (jobs) feat(jobs): `JOB_RUNNER=worker|inline` dispatcher; inline `after()` path = no workers on Vercel
- `ac86c72` fix(auth): conflicting Google env warning, Google users upserted with org, `AUTH_ALLOWED_EMAIL_DOMAIN`
- `b9ddcef` fix(jobs): sequential inline admin fan-out (Resend rate limit)
- MCP: removed broken `vercel` (SSE) + misconfigured `caveman-shrink`; Composio already connected
- Local `.env`: Google creds migrated legacy→`AUTH_GOOGLE_*` (root cause of broken login: empty `AUTH_GOOGLE_*` shadowing real legacy values), `JOB_RUNNER="inline"`, model updated

E2E smoke verified (prod build, no workers): PDF parse COMPLETED via gemini-2.5-flash; DOCX parse COMPLETED; preview route 401 logged-out; EmailLog rows written for confirmation + admin fan-out.

CodeRabbit review triage (`afa2270`): fixed SETUP.md §4.3 (RESUME_PARSE_MODE default is `queue`; documented JOB_RUNNER=inline), added domain-allowlist bypass regression test and inline fan-out failure-behavior test. Skipped as invalid: preview-route contentType null guard (type is always `string`), endsWith "subdomain bypass" (the `@` anchor already enforces exact domain), synchronous inline sends (fire-and-forget by design; failures land in EmailLog).

## Still open

- Merge PR #89 → main, then main → master to deploy
- Vercel env: set `AUTH_GOOGLE_ID/SECRET`, `AUTH_SECRET`, `OPENROUTER_API_KEY`, `RESEND_API_KEY`; verify GCP redirect URI for prod domain
- Verify a Resend domain for production `EMAIL_FROM` (test sender only delivers to account owner)
- Follow-up: `/api/resumes/*` unauthenticated (pre-existing)

## Next recommended action

Merge PR #89, set the Vercel env vars above, then smoke a PDF application on production.

## Risks/blockers encountered

- Resend free tier: unverified domain blocks delivery to non-owner addresses (logged in EmailLog, expected)
- Inline LLM call bounded by serverless maxDuration (60s); Retry button is the recovery path
