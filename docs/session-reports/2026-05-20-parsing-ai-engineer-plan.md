# Session Report: 2026-05-20 Parsing AI Engineer Plan

## Goal

Prepare the next implementation pass to fix resume parsing and add the AI Engineer seed job/template from the external sample job post.

## Current State

- Branch: `main`
- Latest observed commit: `11c4521 fix applicant deletion and resume submission handling`
- PR `#69 fix: improve resume parsing and handoff docs` is merged.
- PDF extraction is fixed, and browser application submission reached OpenRouter.
- Remaining parsing blocker: default model `deepseek/deepseek-chat-v3.1:free` returns `404 No endpoints found`.
- Live OpenRouter model metadata showed `openrouter/owl-alpha` as a free model supporting `response_format`.

## Implementation Plan

- Update `src/lib/llm/openrouter.ts` so parsing uses model fallbacks:
  - first `OPENROUTER_MODEL`, when configured
  - then `openrouter/owl-alpha`
  - then one additional current free JSON-capable fallback if verified during implementation
- Retry parsing/scoring only for provider/model availability failures such as 404, no endpoint, or unsupported model.
- Keep Zod validation in `src/lib/llm/resume.ts` and `src/lib/match/scoreApplicant.ts`; do not accept unstructured LLM output.
- Update `.env.example`, `README.md`, and docs to remove the dead DeepSeek default.
- Add one active seeded job and one reusable template in `prisma/seed.ts`:
  - title: `AI Engineer, Global Security`
  - slug: `ai-engineer-global-security`
  - department: `Technology and Operations`
  - location: `Toronto, Ontario, Canada`
  - type: `Full-time`
  - salary: `Competitive`
  - custom fields: portfolio/GitHub, LLM/RAG experience, security/compliance background, preferred focus select
- Use the external sample as content guidance but keep the seed as ScoutLane demo data, not exact RBC branding.
- Also fix `src/server/services/jobs/create-impl.ts` so `slug`, `department`, `whatYouWillDo`, `requirements`, and `toolsAndSkills` are included in `jobCreationSchema.safeParse`.

## Important Working Tree Note

The following app fixes were pushed in `11c4521`. Do not revert them:

- required custom application fields
- select custom field options
- production guard for local resume storage
- applicant update/delete work
- admin parse-now for pending/stuck resume parsing

Generated `playwright-report/` remains untracked and should not be committed.

## Verification

Run after implementation:

```bash
pnpm typecheck
pnpm test -- --run
pnpm test:e2e
pnpm db:seed
```

Manual checks:

- Confirm `/careers/ai-engineer-global-security` renders.
- Submit `RichardPillaca_RESUME.pdf` using `ridi.pillaca@gmail.com`.
- Confirm the applicant has `resumeUrl`, `parsingStatus=COMPLETED`, populated `parsedData`, numeric `score`, and `data.match`.
- Confirm required custom fields block empty submission and select options render.

## Open Issues

- P1 parsing: implement OpenRouter fallback model policy.
- P1 seed data: add AI Engineer job/template.
- P2 email: local confirmation still needs `RESEND_API_KEY` and `EMAIL_FROM`.
- P2 job creation: include structured fields in `createJobImpl` parsing.
