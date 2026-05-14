# Testing Patterns

**Analysis Date:** 2026-05-13

## CRITICAL CONTEXT: No Tests Currently Exist

**Status:** Vitest is fully configured and wired up, but **ZERO test files exist in `src/`**. The testing framework is ready; developers have not yet written tests.

- No `*.test.ts`, `*.test.tsx`, `*.spec.ts`, or `*.spec.tsx` files found in codebase
- `src/test/setup.ts` is minimal (imports testing-library/jest-dom/vitest)
- CI workflow defined in `.github/workflows/ci.yml` but runs empty test suite
- **First implementation should write tests for business logic in `src/server/services/`** before adding more untested features

## Test Framework

**Runner:**
- Vitest 4.1.4
- Config: `vitest.config.ts` in project root
- Environment: jsdom (browser-like DOM testing)
- Globals: true (describe, it, expect available without imports)
- Setup file: `src/test/setup.ts` (imports testing-library jest-dom matchers)

**Assertion Library:**
- Vitest's built-in assertions (compatible with Jest)
- `@testing-library/jest-dom` 6.9.0 for DOM matchers

**Run Commands:**
```bash
pnpm test                    # Run all tests (watch mode by default)
pnpm test -- --run           # Run all tests once (CI mode)
pnpm test -- path/to/file.test.ts    # Single test file
pnpm test -- -t "pattern"    # Single test by name pattern
```

**Other Testing Frameworks Configured:**
- Playwright 1.59.0 (E2E) — wired in package.json but NO e2e tests exist
- Command: `pnpm test:e2e` runs empty Playwright suite
- No playwright.config.ts in repo

## Test File Organization

**Location:**
- Co-located approach: tests adjacent to implementation
- Convention: `src/path/to/feature.test.ts` next to `src/path/to/feature.ts`
- Example structure (proposed):
  ```
  src/server/services/jobs/create.ts
  src/server/services/jobs/create.test.ts
  src/schemas/job.ts
  src/schemas/job.test.ts
  ```

**Naming:**
- Test files: `*.test.ts` or `*.test.tsx` (Vitest includes: `**/*.test.{ts,tsx}`)
- Describe blocks use PascalCase (matches export name): `describe("createJob", ...)`
- Test names describe the scenario: `it("should return error if title is missing")`, `it("creates job with default stages when no template provided")`

**Structure:**
```
src/
├── server/services/
│   ├── jobs/
│   │   ├── create.ts
│   │   ├── create.test.ts      # ← Test co-located
│   │   ├── read.ts
│   │   ├── read.test.ts
│   │   └── index.ts
├── schemas/
│   ├── job.ts
│   ├── job.test.ts            # ← Test co-located
│   └── index.ts
└── test/
    └── setup.ts              # Global test setup
```

## Test Structure

**Suite Organization:**

```typescript
// Template structure (proposed based on existing patterns)
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { jobCreationSchema } from "@/schemas/job";

describe("jobCreationSchema", () => {
  it("accepts valid job creation data", () => {
    const input = {
      title: "Senior Engineer",
      description: "We are looking for...",
      location: "Remote",
      type: "Full-time",
      salary: "$120k-$150k",
      status: "draft",
    };
    
    const result = jobCreationSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe("Senior Engineer");
    }
  });

  it("rejects title shorter than 3 characters", () => {
    const input = {
      title: "SE",  // Too short
      description: "Valid description that meets minimum length requirements...",
    };
    
    const result = jobCreationSchema.safeParse(input);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("must be at least 3 characters");
    }
  });
});
```

**Patterns:**
- **Setup:** `beforeEach()` for shared test data or mock initialization
- **Teardown:** `afterEach()` for cleanup (mocks, database state, etc.)
- **Assertions:** `expect(value).toBe(expected)`, `expect(array).toContainEqual(item)`
- **Async tests:** `it("async test", async () => { await ... })`

## Mocking

**Framework:**
- Vitest has built-in mocking via `vi.mock()` and `vi.spyOn()`
- No external mocking library configured (could add `jest-mock-extended` or `@testing-library/jest-dom` helpers)

**What to Mock (Proposed):**
- Database (Prisma): Use mocked `prisma` client with Vitest mocks
- External APIs: Google Auth, GCS, Resend email, OpenAI, Supabase
- Server actions: When testing components that call server actions
- `next/navigation`: When testing components that use `useRouter`, `useSearchParams`

**What NOT to Mock:**
- Zod schemas — test validation rules directly with real schema
- Utility functions — test actual behavior (e.g., `cn()`, `slugify()`)
- Next.js primitives in components unless the test requires them (e.g., don't mock `<Link>` unless testing routing)

**Example Mocking Pattern (Proposed):**

```typescript
import { vi } from "vitest";

// Mock Prisma
vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    job: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
  },
}));

// Mock server action
vi.mock("@/server/services/jobs/create", () => ({
  createJob: vi.fn().mockResolvedValue({ success: true, jobId: "123" }),
}));
```

## Fixtures and Factories

**Test Data:**
- Not yet established; no fixtures exist
- Proposed approach (Factory pattern):

```typescript
// src/test/factories/job.ts
import type { Job } from "@/generated/prisma/client";

export function createMockJob(overrides?: Partial<Job>): Job {
  return {
    id: "job-123",
    title: "Senior Engineer",
    slug: "senior-engineer",
    description: "Description",
    organizationId: "org-123",
    createdById: "user-123",
    published: true,
    archived: false,
    location: "Remote",
    type: "Full-time",
    salary: "$120k",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

// Usage in tests
it("displays job title", () => {
  const job = createMockJob({ title: "Product Manager" });
  // ... test with job
});
```

**Location:**
- Proposed: `src/test/factories/` for entity builders
- Proposed: `src/test/mocks/` for API/service mocks
- Proposed: `src/test/fixtures/` for static test data (JSON)

**Faker Usage:**
- `@faker-js/faker` 10.4.0 is already installed (not yet used)
- Recommended for generating realistic test data without hardcoding IDs/emails

## Coverage

**Requirements:** No coverage threshold enforced yet (no CI check)

**View Coverage:**
```bash
pnpm test -- --coverage    # Generates coverage report
# Output saved to coverage/ directory
```

## Test Types

**Unit Tests:**
- Scope: Individual functions, Zod schemas, utilities
- Approach: Test single inputs/outputs without side effects
- Examples to write first:
  - `src/schemas/job.test.ts` — validation rules for all Zod schemas
  - `src/lib/jobs/status.test.ts` — getJobStatus(), getJobPersistence(), canAcceptApplications()
  - `src/lib/utils/cn.test.ts` — verify Tailwind + clsx merging
  - `src/lib/slug/slugify.test.ts` — slug generation

**Integration Tests:**
- Scope: Server actions + database, API routes + services
- Approach: Test with real Prisma client or mocked version
- Examples to write:
  - `src/server/services/jobs/create.test.ts` — creates job with stages, handles org creation
  - `src/app/api/admin/jobs/[id]/pipeline/route.test.ts` — grouping applicants by stage
  - Form submission end-to-end (server action + database write)

**E2E Tests:**
- Framework: Playwright 1.59.0 (installed, no config yet)
- Command: `pnpm test:e2e`
- Scope: Critical user flows (none written yet)
- Proposed critical flows to test:
  - User signs in (dev credentials)
  - Creates a job
  - Applies to job via public careers page
  - Views applicant in pipeline

## Common Patterns

**Async Testing:**

```typescript
// ✓ Correct: await the async function
it("fetches job by id", async () => {
  const job = await getJob("job-123");
  expect(job?.title).toBe("Senior Engineer");
});

// ✗ Wrong: not awaiting
it("fetches job by id", () => {
  const promise = getJob("job-123");
  expect(promise).toBeInstanceOf(Promise); // Tests the promise, not the result
});
```

**Error Testing:**

```typescript
// ✓ Correct: catch the error
it("throws unauthorized when no session", async () => {
  vi.mock("@/lib/auth/auth", () => ({
    auth: vi.fn().mockResolvedValue(null),
  }));
  
  await expect(requireSession()).rejects.toThrow("Not authenticated");
});

// Or test with safeParse
it("validates title length", () => {
  const result = jobCreationSchema.safeParse({
    title: "SE",
    description: "Long enough description here...",
  });
  
  expect(result.success).toBe(false);
  expect(result.error?.issues).toHaveLength(1);
  expect(result.error?.issues[0].code).toBe("too_small");
});
```

**Component Testing (React Testing Library):**

```typescript
// ✓ Pattern: test user interactions, not implementation
import { render, screen } from "@testing-library/react";
import { NewJobForm } from "@/components/admin/NewJobForm";

it("displays form and submits on button click", async () => {
  const { user } = render(<NewJobForm />);
  
  const titleInput = screen.getByLabelText(/job title/i);
  await user.type(titleInput, "Senior Engineer");
  
  const submitButton = screen.getByRole("button", { name: /create job/i });
  await user.click(submitButton);
  
  // Assert on visible outcomes, not internal state
  expect(screen.queryByText(/could not create/i)).not.toBeInTheDocument();
});
```

## Testing Best Practices

**Do:**
- Write tests BEFORE implementing features (TDD approach)
- Test business logic (schemas, services) thoroughly
- Mock external dependencies (Prisma, APIs, auth)
- Use descriptive test names that explain the scenario
- Test error paths and edge cases
- Keep tests isolated (no shared state between tests)
- Use factories for test data (don't hardcode)

**Don't:**
- Test framework internals (React.useState behavior)
- Test implementation details (mock hooks, spy on internal calls)
- Have slow tests (> 1 second per test)
- Skip tests with `.skip()` in commits
- Hardcode IDs/emails in tests — use factories instead

## Current State Summary

| Item | Status |
|------|--------|
| Framework | ✓ Vitest 4.1.4 configured |
| Environment | ✓ jsdom setup |
| Setup file | ✓ `src/test/setup.ts` exists |
| Test files | ✗ ZERO test files in src/ |
| Coverage tracking | ✗ No coverage enforced |
| E2E framework | ✓ Playwright installed, unconfigured |
| CI integration | ✓ `pnpm test` wired to CI, runs empty suite |
| TDD practices | ✗ Not started yet |

**Action Items for First Developer:**
1. Write unit tests for all Zod schemas (`src/schemas/*.test.ts`)
2. Write unit tests for status helpers (`src/lib/jobs/status.test.ts`)
3. Write service tests for create/read/update operations
4. Create test fixtures in `src/test/factories/`
5. Configure Playwright for E2E tests of critical flows
6. Add coverage threshold enforcement to CI (80%+ target per CLAUDE.md)

---

*Testing analysis: 2026-05-13*
