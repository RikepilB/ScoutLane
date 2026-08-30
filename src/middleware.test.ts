// @vitest-environment node
import { afterAll, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@clerk/nextjs/server", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@clerk/nextjs/server")>();
  return {
    ...actual,
    // clerkMiddleware normally wraps the handler with real Clerk request context.
    // Returning the handler unwrapped lets tests supply a fake `auth()` directly.
    clerkMiddleware: (handler: unknown) => handler,
  };
});

const originalClerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

async function loadMiddleware(clerkKey: string | undefined) {
  vi.resetModules();
  if (clerkKey === undefined) {
    delete process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  } else {
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = clerkKey;
  }
  const mod = await import("./middleware");
  return mod.default as unknown;
}

function fakeAuth(userId: string | null) {
  return async () => ({ userId });
}

function isRedirect(res: Response) {
  return res.headers.get("location") !== null;
}

describe("middleware — Clerk configured", () => {
  it("passes a public route through without checking auth", async () => {
    const middleware = (await loadMiddleware("pk_test_123")) as (
      auth: () => Promise<{ userId: string | null }>,
      req: NextRequest,
    ) => Promise<Response>;
    const req = new NextRequest("http://localhost/jobs");

    const res = await middleware(fakeAuth(null), req);

    expect(isRedirect(res)).toBe(false);
  });

  it("passes a job shortlink path through without checking auth", async () => {
    const middleware = (await loadMiddleware("pk_test_123")) as (
      auth: () => Promise<{ userId: string | null }>,
      req: NextRequest,
    ) => Promise<Response>;
    const req = new NextRequest("http://localhost/senior-backend-engineer");

    const res = await middleware(fakeAuth(null), req);

    expect(isRedirect(res)).toBe(false);
  });

  it("redirects an unauthenticated request on a protected route to /signin with redirect_url", async () => {
    const middleware = (await loadMiddleware("pk_test_123")) as (
      auth: () => Promise<{ userId: string | null }>,
      req: NextRequest,
    ) => Promise<Response>;
    const req = new NextRequest("http://localhost/admin/jobs");

    const res = await middleware(fakeAuth(null), req);

    expect(isRedirect(res)).toBe(true);
    const location = new URL(res.headers.get("location")!);
    expect(location.pathname).toBe("/signin");
    expect(location.searchParams.get("redirect_url")).toBe("http://localhost/admin/jobs");
  });

  it("allows an authenticated request through on a protected route", async () => {
    const middleware = (await loadMiddleware("pk_test_123")) as (
      auth: () => Promise<{ userId: string | null }>,
      req: NextRequest,
    ) => Promise<Response>;
    const req = new NextRequest("http://localhost/admin/jobs");

    const res = await middleware(fakeAuth("user_123"), req);

    expect(isRedirect(res)).toBe(false);
  });
});

describe("middleware — Clerk not configured", () => {
  it("passes every request through without calling Clerk", async () => {
    const middleware = (await loadMiddleware(undefined)) as (req: NextRequest) => Promise<Response>;
    const req = new NextRequest("http://localhost/admin/jobs");

    const res = await middleware(req);

    expect(isRedirect(res)).toBe(false);
  });
});

afterAll(() => {
  if (originalClerkKey !== undefined) {
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = originalClerkKey;
  } else {
    delete process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  }
});
