# Repository Guidelines

## Project Structure & Module Organization

ScoutLane is a Next.js 16 recruitment platform using React 19, Prisma, and TypeScript. Main app routes live in `src/app`, reusable UI in `src/components`, shared utilities in `src/lib`, server-side workflows in `src/server`, validation schemas in `src/schemas`, and shared types in `src/types`. Prisma schema, migrations, and seed data are in `prisma`. Static assets belong in `public`. Unit and integration tests are colocated as `*.test.ts` or `*.test.tsx`; browser tests live in `tests/e2e`.

Read `docs/handoff/HANDOFF.md` (the handoff-tree father) before larger changes — or invoke the `handoff-context` skill to load full context via Explore/Plan subagents. Record session work in the handoff tree at `docs/handoff/<YYYY-MM-DD>-<name>/HANDOFF.md` and update the father's `## Current state` + `## Session index` (append, never overwrite). This supersedes the old `docs/HANDOFF.md` + `docs/session-reports/`.

## Build, Test, and Development Commands

Use `pnpm` for all package commands.

- `pnpm dev`: start the local Next.js dev server.
- `pnpm build`: create a production build.
- `pnpm start`: run the production server after building.
- `pnpm lint`: run ESLint across the repo.
- `pnpm typecheck`: run TypeScript without emitting files.
- `pnpm test`: run Vitest tests in jsdom.
- `pnpm test:e2e`: run Playwright end-to-end tests.
- `pnpm prisma:migrate`: create/apply local Prisma migrations.
- `pnpm db:seed`: seed development data.
- `pnpm db:studio`: open Prisma Studio.

## Coding Style & Naming Conventions

Use TypeScript, 2-space indentation, semicolons, double quotes, trailing commas, and a 100-character print width as defined in `.prettierrc`. Prefer the `@/` alias for imports from `src`. Components use `PascalCase`, hooks use `useCamelCase`, and server/service helpers use descriptive camelCase names. Keep server-only logic in `src/server` or server actions, not client components.

## Testing Guidelines

Vitest uses `src/test/setup.ts` and matches `**/*.test.{ts,tsx}`. Add focused tests near changed logic, especially for parsing, auth, application submission, and Prisma-backed services. Use Playwright specs in `tests/e2e` for public flows such as job pages, application forms, sign-in, and admin navigation. Before handing off substantial work, run `pnpm typecheck`, `pnpm test`, and relevant `pnpm test:e2e` specs.

## Commit & Pull Request Guidelines

Recent history uses concise conventional-style messages such as `fix: improve public job application readability`. Prefer `fix:`, `feat:`, `docs:`, `test:`, or `chore:` with an imperative summary. PRs should include the user-facing change, verification commands, linked issue or task, screenshots for UI changes, and notes for environment or migration changes.

## Security & Configuration Tips

Do not commit `.env`, API keys, OAuth secrets, uploaded resumes, or generated reports. Use `.env.example` for required variables. Resume uploads and local artifacts should stay under ignored local storage such as `.data/`.
