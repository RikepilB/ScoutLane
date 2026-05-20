# Session Report: 2026-05-20 Parsing Performance Test

## Goal

Run app tests around job application/resume parsing and measure performance when moving between pages.

## What Changed

- Fixed PDF text extraction for the installed `pdf-parse` v2 API by using `PDFParse` with `Uint8Array` input.
- Added `pdf-parse` to `serverExternalPackages` so Next runs the server-side parser as an external package instead of bundling its worker incorrectly.
- Aligned the existing `extractTextFromResumeBuffer` test mock with the `Uint8Array` API shape.
- Intentionally ignored `.data/` because local resume uploads are written under `.data/resumes`.

## Files Changed

- `.gitignore`
- `next.config.ts`
- `src/lib/resume/extractText.ts`
- `src/lib/resume/extractText.test.ts`
- `docs/HANDOFF.md`
- `docs/README.md`
- `docs/session-reports/2026-05-20-parsing-performance-test.md`

## Verification

Commands run:

```bash
pnpm typecheck
pnpm test -- --run
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3008 pnpm test:e2e
agent-browser vitals http://localhost:3008/ --json
agent-browser vitals http://localhost:3008/careers --json
agent-browser vitals http://localhost:3008/careers/data-scientist --json
agent-browser vitals http://localhost:3008/signin --json
```

Results:

- `pnpm typecheck` passed.
- `pnpm test -- --run` passed: 12 files, 59 tests.
- `pnpm test:e2e` passed: 6 Playwright smoke tests.
- Direct `PDFParse` check against `RichardPillaca_RESUME.pdf` extracted 3712 chars.
- Browser submit on `http://localhost:3009/careers/senior-frontend-engineer` POSTed successfully and showed `Application submitted successfully.`
- Resume extraction passed the PDF worker stage; the remaining parse failure is OpenRouter model availability: `404 No endpoints found for deepseek/deepseek-chat-v3.1:free`.

Performance results in local dev mode:

| Route / Transition | Result |
|---|---:|
| `/` cold load | 1620ms navigation script; vitals TTFB 1022.9ms, LCP 1140ms, CLS 0 |
| `/careers` cold load | vitals TTFB 234ms, LCP 452ms, CLS 0 |
| `/careers/data-scientist` cold load | vitals TTFB 1155.3ms, LCP 1280ms, CLS 0 |
| `/signin` cold load | vitals TTFB 130.8ms, LCP 224ms, CLS 0 |
| `/` to `/careers/devops-engineer` click | 544ms |
| detail to `/` click | 372ms |
| `/` to `/careers/backend-platform-engineer` click | 381ms |
| `/signin` goto | 662ms |

## Commit / Push Status

- Branch: `feat/redesign`
- Commit: Not committed in this session
- Push: Not pushed in this session

## Open Issues

- P1 OpenRouter model config: `deepseek/deepseek-chat-v3.1:free` returned 404. Set `OPENROUTER_MODEL` to an available model, then re-run the submit.
- P2 email confirmation: local submit logs `RESEND_API_KEY is not configured`; configure Resend env before email-flow validation.
- P2 dev server: use the same host as the running server. `localhost` worked; `127.0.0.1` caused Next dev cross-origin resource warnings.

## Next Agent Instructions

- Start the app on `localhost` and use the same host in browser tests to avoid Next dev cross-origin blocking.
- Re-run a clean application submit after configuring `OPENROUTER_MODEL`, `RESEND_API_KEY`, and `EMAIL_FROM`.
- After submit, inspect the applicant row for `parsingStatus`, `parsedData`, `data.match`, and `score`.
