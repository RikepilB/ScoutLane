// @vitest-environment node
import { describe, expect, it } from "vitest";
import authConfig, { type AdminRole } from "@/lib/auth/auth.config";

const jwtCallback = authConfig.callbacks!.jwt!;
const sessionCallback = authConfig.callbacks!.session!;

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
