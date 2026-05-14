# Coding Conventions

**Analysis Date:** 2026-05-13

## Naming Patterns

**Files:**
- PascalCase for React components: `NewJobForm.tsx`, `KanbanBoard.tsx`, `ApplicantCard.tsx`
- camelCase for utilities, services, and hooks: `cn.ts`, `slugify.ts`, `validate-session.ts`, `current-user.ts`
- kebab-case for directory names: `_components/`, `_lib/`, `pipeline/`, `public/`
- Underscores prefix private folders (Next.js convention): `_components/` (co-located with page), `_lib/` (internal to service)
- API route folders use bracket notation for dynamic segments: `[id]/`, `[slug]/`, `[...nextauth]/`

**Functions:**
- camelCase: `createJob()`, `getApplicants()`, `updateApplicantStatus()`, `requireSession()`
- Action functions (server-side) exported as named exports: `export async function createJob()`
- Prefix descriptors for clarity: `get*` (reads), `create*` (writes), `update*` (mutations), `require*` (assertions/guards)

**Variables:**
- camelCase: `formData`, `watchedTitle`, `organizationId`, `sessionEmail`, `createdJob`
- Constants in UPPER_CASE: `defaultStages` array defined at module level
- Boolean variables prefixed with `is` or suffixed with state context: `isAuth`, `isPublic`, `isPending`

**Types:**
- PascalCase for types and interfaces: `AuthenticatedUser`, `JobActionResult`, `KanbanBoardProps`
- Suffixes for clarity: `*Props` (component props), `*Result` (function returns), `*Params` (function parameters), `*Input` (Zod inferred types)
- Enum-like const arrays use descriptive names: `jobStatusValues`, `defaultStages`

## Code Style

**Formatting:**
- Prettier with configuration in `.prettierrc`:
  - `semi: true` — semicolons required
  - `singleQuote: false` — double quotes preferred
  - `trailingComma: "all"` — trailing commas in multiline structures
  - `printWidth: 100` — 100 character line limit
  - `tabWidth: 2` — 2-space indentation

**Linting:**
- ESLint 9 with flat config in `eslint.config.mjs`
- Extends Next.js recommended rules + core-web-vitals
- Extends React recommended rules + jsx-runtime (no prop-types required)
- Extends React Hooks rules
- Extends jsx-a11y rules for accessibility
- Rule override for test files: `@typescript-eslint/no-explicit-any` turned off in `**/*.test.{ts,tsx}`
- No `console.log` statements in production code — use proper logging instead

**TypeScript:**
- Strict mode enabled (`"strict": true` in `tsconfig.json`)
- Target: ES2022, moduleResolution: bundler
- No explicit `any` types (except in test files)
- Type imports explicitly imported: `import type { ReactNode }`, `import type { z }`

## Import Organization

**Order:**
1. Next.js imports: `import Link from "next/link"`, `import { revalidatePath } from "next/cache"`
2. Third-party library imports: `import { useForm } from "react-hook-form"`, `import { zodResolver } from "@hookform/resolvers/zod"`
3. Prisma and database imports: `import { prisma } from "@/lib/db/prisma"`, `import type { PrismaClient }`
4. Internal lib imports: `import { cn } from "@/lib/utils/cn"`, `import { requireSession } from "@/server/services/_lib/validate-session"`
5. Server service imports: `import { createJob } from "@/server/services/jobs/create"`
6. Schema imports: `import { jobCreationSchema } from "@/schemas/job"`
7. Component imports: `import { Button } from "@/components/ui/button"`, `import { NewJobForm } from "@/components/admin/NewJobForm"`
8. Type-only imports separated at top: `import type { AdminRole }`, `import type { DragEndEvent }`

**Path Aliases:**
- `@/*` resolves to `./src/*` (configured in both `tsconfig.json` and `vitest.config.ts`)
- Never use relative imports like `../../lib/` — always use `@/` alias
- Never import from `@prisma/client` — import from `@/generated/prisma/client` (Prisma client is generated to `src/generated/prisma/`)

**Barrel Exports:**
- Every service module exposes public API via `index.ts`: `src/server/services/applicants/index.ts` re-exports `getApplicants`, `updateApplicantStatus`
- Service submodules imported from barrel: `import { createJob } from "@/server/services/jobs"` (not `"@/server/services/jobs/create"`)
- Allows safe refactoring of internal module structure without breaking imports

## Error Handling

**Custom Error Classes:**
- `ServiceError` class in `src/server/services/_lib/errors.ts` extends `Error`
- Constructor takes message and optional code: `new ServiceError(message, code)`
- Named factory functions for common errors: `unauthorized()`, `notFound(entity)`
- Used by server services to signal specific failure modes

**Try-Catch in Server Actions:**
- Server actions use `safeParse()` for validation: `const parsed = jobCreationSchema.safeParse({...})`
- Return error objects instead of throwing: `return { success: false, error: "message" }`
- Client components show error UI: `if (!result.success) { setError(result.error ?? "Default message") }`
- Session guards with `requireSession()` utility throw errors that surface as 401s

**Route Handler Errors:**
- API routes (`src/app/api/*/route.ts`) are thin and delegate to services
- Services handle validation and authorization; routes return JSON with error fields

**Error Messages:**
- User-facing: Short, actionable messages in UI: "Could not create the job."
- Server-side: Detailed logs on error conditions for debugging
- Never expose internal details (stack traces, SQL, file paths) to client

## Logging

**Framework:** No structured logging library configured yet. Current approach:
- Prisma logs configured at `{ log: ["error"] }` in `src/lib/db/prisma.ts`
- Console methods avoided in production code
- Future logging should use a structured logger (Pino, Winston, or Vercel's built-in analytics)

**Patterns Observed:**
- Server actions don't log — they return structured results
- Errors are passed back to client for display
- Database logs surfaced via Prisma config only

## Comments

**When to Comment:**
- JSDoc comments on exported functions and types in utility/service modules
- Inline comments for non-obvious logic (e.g., "job status is derived from archived/published flags")
- No comments on obvious code: `const job = await getJob(id)` needs no explanation
- Comments on business logic: "Stage names that don't match enum values produce empty columns"

**JSDoc/TSDoc:**
- Not heavily used; types are self-documenting (Zod schemas, TypeScript interfaces)
- Example: `src/server/services/_lib/validate-session.ts` has clear type exports but minimal comments
- Function signatures with type annotations serve as inline documentation

## Function Design

**Size:**
- Target: < 50 lines per function
- Example: `getJob()` is 10 lines, `createJob()` is 93 lines (upper boundary; handles multiple concerns: validation, org lookup, template apply)
- Large functions acceptable when they contain sequential operations with clear phases

**Parameters:**
- Prefer single object parameter over multiple positional args: `getApplicants({ jobId, search, status, sortBy, sortOrder })`
- Named parameters enable default values and optional fields
- Server actions accept `FormData` for request bodies

**Return Values:**
- Consistent result objects from server actions: `{ success: boolean, error?: string, data?: T }`
- Services return entities directly: `await getJob(id)` returns `Job | null`
- Multiple return values use destructuring: `const [applicants, total] = await Promise.all([...])`

## Module Design

**Exports:**
- Barrel index files (`index.ts`) re-export only public API
- Example `src/server/services/jobs/index.ts`:
  ```typescript
  export { createJob } from "./create";
  export { getJob } from "./read";
  export { updateJob } from "./update";
  export { deleteJob } from "./delete";
  ```
- Internal `_lib/` folders for shared helpers within a service module
- Never import from private (`_lib/`, `_components/`) directly; go through barrel

**Code Organization by Domain:**
- `src/server/services/{domain}/{crud}.ts` — business logic split by operation
- `src/lib/{infrastructure}/` — database client, auth config, email, storage, LLM
- `src/schemas/` — Zod validation schemas (shared server + client)
- `src/app/(public)/` and `src/app/(admin)/` — route groups for layout/middleware control
- `src/components/` — reusable UI; `src/components/admin/`, `src/components/pipeline/`, etc.
- `src/components/{page-path}/_components/` — page-specific, co-located components

**"use server" Directive:**
- Required at top of async server action files: `"use server";`
- Example: `src/server/services/jobs/create.ts`, `src/server/services/applicants/read.ts`
- Client components that call server actions marked with `"use client"`

**"use client" Directive:**
- Applied only to components with interactivity: forms, hooks, drag-and-drop
- Examples: `NewJobForm.tsx` (useForm, useState), `KanbanBoard.tsx` (dnd-kit, DndContext)
- Not applied to container/layout components that don't need state
- Pages are Server Components by default; add `"use client"` sparingly

## Data Validation

**Zod Schemas:**
- All input validation done with Zod in `src/schemas/`
- Example `jobCreationSchema` in `src/schemas/job.ts`:
  - Min/max string lengths with custom messages
  - Regex validation for slugs
  - Enum validation with `z.enum(jobStatusValues)`
  - Optional fields with `.optional().or(z.literal("").transform(() => undefined))`
- Schemas imported by both server services and client components (forms)
- Types inferred from schemas: `type JobCreationInput = z.infer<typeof jobCreationSchema>`

**Validation Patterns:**
- Server actions: `const parsed = schema.safeParse(input); if (!parsed.success) return { success: false, error: ... }`
- Client forms: `useForm({ resolver: zodResolver(schema) })`
- Request handlers: `const body = schema.parse(JSON.parse(await request.text()))` (fails fast on invalid input)

## Immutability

**Spread Operator for Updates:**
- Objects: `return { ...user, name }`
- Arrays: `return [...items, newItem]`
- Never mutate function parameters or state

**React State:**
- `useState` for component-level state (forms, modals, pending states)
- `useTransition` for async server action state tracking
- Immutable state updates in callbacks: `setError(null)`, `setActiveId(null)`

**Prisma:**
- Prisma client returns new data objects; no mutation concerns
- Form submission creates `FormData` with `formData.set()` (creates new object)

---

*Convention analysis: 2026-05-13*
