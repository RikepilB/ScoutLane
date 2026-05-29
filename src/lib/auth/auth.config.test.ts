// @vitest-environment node
import { describe, expect, it, afterEach, vi } from "vitest";
import { isDevLoginAllowed, isGoogleAuthConfigured } from "@/lib/auth/auth.config";
import authConfig, { type AdminRole } from "@/lib/auth/auth.config";

const jwtCallback = authConfig.callbacks!.jwt!;
const sessionCallback = authConfig.callbacks!.session!;

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("isGoogleAuthConfigured", () => {
  it("returns true when AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET are set", () => {
    vi.stubEnv("AUTH_GOOGLE_ID", "some-id");
    vi.stubEnv("AUTH_GOOGLE_SECRET", "some-secret");
    expect(isGoogleAuthConfigured()).toBe(true);
  });

  it("returns true when GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set", () => {
    vi.stubEnv("GOOGLE_CLIENT_ID", "some-id");
    vi.stubEnv("GOOGLE_CLIENT_SECRET", "some-secret");
    expect(isGoogleAuthConfigured()).toBe(true);
  });

  it("returns false when neither AUTH_GOOGLE_ID nor GOOGLE_CLIENT_ID is set", () => {
    expect(isGoogleAuthConfigured()).toBe(false);
  });

  it("returns false when AUTH_GOOGLE_ID is empty string", () => {
    vi.stubEnv("AUTH_GOOGLE_ID", "");
    vi.stubEnv("AUTH_GOOGLE_SECRET", "some-secret");
    expect(isGoogleAuthConfigured()).toBe(false);
  });

  it("returns false when only ID is set without secret", () => {
    vi.stubEnv("AUTH_GOOGLE_ID", "some-id");
    expect(isGoogleAuthConfigured()).toBe(false);
  });
});

describe("isDevLoginAllowed", () => {
  it("allows dev login in development regardless of Google config", () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(isDevLoginAllowed()).toBe(true);
  });

  it("disallows dev login in production when Google auth is configured via AUTH_GOOGLE_ID", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("AUTH_GOOGLE_ID", "some-id");
    vi.stubEnv("AUTH_GOOGLE_SECRET", "some-secret");
    expect(isDevLoginAllowed()).toBe(false);
  });

  it("disallows dev login in production when Google auth is configured via GOOGLE_CLIENT_ID", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("GOOGLE_CLIENT_ID", "some-id");
    vi.stubEnv("GOOGLE_CLIENT_SECRET", "some-secret");
    expect(isDevLoginAllowed()).toBe(false);
  });

  it("allows dev login in production when Google auth is NOT configured", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(isDevLoginAllowed()).toBe(true);
  });
});

describe("authConfig.callbacks.jwt", () => {
  it("copies role and userId from user on first sign-in", async () => {
    const token = await jwtCallback({
      token: {},
      user: { id: "user-1", role: "ADMIN" as AdminRole } as unknown as never,
      account: null,
      trigger: undefined,
    } as unknown as Parameters<typeof jwtCallback>[0]);

    expect(token.role).toBe("ADMIN");
    expect(token.userId).toBe("user-1");
  });

  it("falls back to 'RECRUITER' when user has no role", async () => {
    const token = await jwtCallback({
      token: {},
      user: { id: "user-2" } as unknown as never,
      account: null,
      trigger: undefined,
    } as unknown as Parameters<typeof jwtCallback>[0]);

    expect(token.role).toBe("RECRUITER");
    expect(token.userId).toBe("user-2");
  });

  it("does not modify token when no user is present and trigger is not 'update'", async () => {
    const token = await jwtCallback({
      token: { role: "ADMIN", userId: "user-3" },
      user: undefined,
      account: null,
      trigger: undefined,
    } as unknown as Parameters<typeof jwtCallback>[0]);

    expect(token.role).toBe("ADMIN");
    expect(token.userId).toBe("user-3");
  });

  it("overrides role on 'update' trigger when session.role is supplied", async () => {
    const token = await jwtCallback({
      token: { role: "RECRUITER", userId: "user-4" },
      user: undefined,
      account: null,
      trigger: "update",
      session: { role: "HIRING_MANAGER" },
    } as unknown as Parameters<typeof jwtCallback>[0]);

    expect(token.role).toBe("HIRING_MANAGER");
  });
});

describe("authConfig.callbacks.session", () => {
  it("enriches session.user with id and role from the token", async () => {
    const session = await sessionCallback({
      session: {
        user: { id: "fallback", email: "x@example.com" },
        expires: "2099-01-01",
      },
      token: { userId: "user-1", role: "ADMIN" },
    } as unknown as Parameters<typeof sessionCallback>[0]);

    expect(session.user.id).toBe("user-1");
    expect(session.user.role).toBe("ADMIN");
  });

  it("falls back to 'RECRUITER' when token has no role", async () => {
    const session = await sessionCallback({
      session: {
        user: { id: "fallback", email: "x@example.com" },
        expires: "2099-01-01",
      },
      token: { userId: "user-2" },
    } as unknown as Parameters<typeof sessionCallback>[0]);

    expect(session.user.role).toBe("RECRUITER");
    expect(session.user.id).toBe("user-2");
  });

  it("keeps existing session.user.id when token has no userId", async () => {
    const session = await sessionCallback({
      session: {
        user: { id: "existing-id", email: "x@example.com" },
        expires: "2099-01-01",
      },
      token: { role: "ADMIN" },
    } as unknown as Parameters<typeof sessionCallback>[0]);

    expect(session.user.id).toBe("existing-id");
    expect(session.user.role).toBe("ADMIN");
  });
});
