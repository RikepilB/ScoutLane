# Guest access and integration hardening

## Scope

Hardened the uncommitted guest-login feature before any production deployment.

Branch: `fix/mask-integration-api-key-input`. Status: uncommitted and not deployed.

## Changes

- Blocked guest users from integration create, test, retry, delete, resume reparse, applicant
  rescore, and CSV export API operations.
- Removed integration API keys from the integrations page query and create-route response.
- Added public-HTTPS egress validation for integration endpoints, including private/local IP
  rejection after DNS resolution, and a 10-second timeout for integration dispatches.
- Rate-limited job-alert subscriptions, preferred the platform client-IP header, and evicted
  expired in-memory counters.
- Added an explicit `PipelineStage.status` mapping with an additive migration/backfill; moving
  applicants now uses this mapping instead of deriving a status from a stage name.
- Completed custom application fields: select options are validated server-side, required
  fields are enforced client- and server-side, and custom document fields upload under the
  existing size/type limits. Attachment metadata is tied to the applicant so authorized
  workspace users can retrieve the stored file.
- Scoped the global integrations page to the signed-in organization, blocked guests from
  integration views, and applied egress validation/timeouts to generic webhooks. Production
  webhook signing now fails closed without `INTEGRATION_KEY_SECRET` and uses a timing-safe check.

## Verification

- `pnpm test -- --run` — 236 passing on 2026-07-18.
- `pnpm typecheck` — passed after replacing direct `NODE_ENV` assignment in
  `src/lib/webhook/sign.test.ts` with `vi.stubEnv`.
- `pnpm lint` — passed with one pre-existing custom-font warning.
- `pnpm build` — passed.
- `pnpm test:e2e` — attempted on 2026-07-18 but timed out after 184 seconds. Partial artifacts
  show page/navigation timeouts; no final Playwright summary was emitted, and the spawned test
  processes were cleaned up.

## Remaining external work

- Apply migrations and seed data only after review and approval.
- Configure the Google OAuth redirect URI and verified Resend sender domain.
- Run E2E against a real Postgres database; the local database configuration remains a known
  blocker.
