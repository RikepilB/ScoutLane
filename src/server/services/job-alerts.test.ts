import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock, mockIsEmailConfigured, mockSendConfirmation, mockSendNotification } = vi.hoisted(() => {
  const fn = () => vi.fn();
  return {
    prismaMock: {
      jobAlert: { upsert: fn(), updateMany: fn(), findMany: fn() },
    },
    mockIsEmailConfigured: fn(),
    mockSendConfirmation: fn(),
    mockSendNotification: fn(),
  };
});

vi.mock("@/lib/db/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/lib/email/client", () => ({ isEmailConfigured: mockIsEmailConfigured }));
vi.mock("@/lib/email/send", () => ({
  sendJobAlertConfirmation: mockSendConfirmation,
  sendNewJobNotification: mockSendNotification,
}));

import { notifySubscribers, subscribe, unsubscribe } from "./job-alerts";

beforeEach(() => {
  prismaMock.jobAlert.upsert.mockReset();
  prismaMock.jobAlert.updateMany.mockReset();
  prismaMock.jobAlert.findMany.mockReset();
  mockIsEmailConfigured.mockReset();
  mockSendConfirmation.mockReset();
  mockSendNotification.mockReset();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("subscribe", () => {
  it("rejects an invalid email without touching the DB", async () => {
    const result = await subscribe("not-an-email");
    expect(result.success).toBe(false);
    expect(prismaMock.jobAlert.upsert).not.toHaveBeenCalled();
  });

  it("normalizes email to lowercase/trimmed before upserting", async () => {
    prismaMock.jobAlert.upsert.mockResolvedValue({});
    mockIsEmailConfigured.mockReturnValue(false);
    await subscribe("  Ada@Example.com  ");
    expect(prismaMock.jobAlert.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { email: "ada@example.com" } }),
    );
  });

  it("sends a confirmation email when email is configured", async () => {
    prismaMock.jobAlert.upsert.mockResolvedValue({});
    mockIsEmailConfigured.mockReturnValue(true);
    mockSendConfirmation.mockResolvedValue({ ok: true });
    const result = await subscribe("ada@example.com");
    expect(mockSendConfirmation).toHaveBeenCalled();
    expect(result.message).toContain("Check your email");
  });

  it("skips the confirmation email when email isn't configured", async () => {
    prismaMock.jobAlert.upsert.mockResolvedValue({});
    mockIsEmailConfigured.mockReturnValue(false);
    const result = await subscribe("ada@example.com");
    expect(mockSendConfirmation).not.toHaveBeenCalled();
    expect(result).toEqual({ success: true, message: "Subscribed!" });
  });

  it("returns a generic failure message when the upsert throws (no internal error leak)", async () => {
    prismaMock.jobAlert.upsert.mockRejectedValue(new Error("db down"));
    const result = await subscribe("ada@example.com");
    expect(result).toEqual({
      success: false,
      message: "Something went wrong. Please try again.",
    });
  });
});

describe("unsubscribe", () => {
  it("returns true when a matching token was deactivated", async () => {
    prismaMock.jobAlert.updateMany.mockResolvedValue({ count: 1 });
    const result = await unsubscribe("token-1");
    expect(result).toBe(true);
    expect(prismaMock.jobAlert.updateMany).toHaveBeenCalledWith({
      where: { token: "token-1" },
      data: { active: false },
    });
  });

  it("returns false when no alert matched the token", async () => {
    prismaMock.jobAlert.updateMany.mockResolvedValue({ count: 0 });
    const result = await unsubscribe("bad-token");
    expect(result).toBe(false);
  });

  it("returns false (not throw) when the DB call fails", async () => {
    prismaMock.jobAlert.updateMany.mockRejectedValue(new Error("db down"));
    const result = await unsubscribe("token-1");
    expect(result).toBe(false);
  });
});

describe("notifySubscribers", () => {
  it("skips entirely when email isn't configured", async () => {
    mockIsEmailConfigured.mockReturnValue(false);
    await notifySubscribers("Engineer", "engineer");
    expect(prismaMock.jobAlert.findMany).not.toHaveBeenCalled();
  });

  it("notifies every active subscriber", async () => {
    mockIsEmailConfigured.mockReturnValue(true);
    prismaMock.jobAlert.findMany.mockResolvedValue([
      { email: "a@x.com", token: "t1" },
      { email: "b@x.com", token: "t2" },
    ]);
    mockSendNotification.mockResolvedValue({ ok: true });

    await notifySubscribers("Engineer", "engineer");

    expect(prismaMock.jobAlert.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { active: true } }),
    );
    expect(mockSendNotification).toHaveBeenCalledTimes(2);
  });

  it("continues notifying remaining subscribers when one send throws", async () => {
    mockIsEmailConfigured.mockReturnValue(true);
    prismaMock.jobAlert.findMany.mockResolvedValue([
      { email: "a@x.com", token: "t1" },
      { email: "b@x.com", token: "t2" },
    ]);
    mockSendNotification
      .mockRejectedValueOnce(new Error("send failed"))
      .mockResolvedValueOnce({ ok: true });

    await expect(notifySubscribers("Engineer", "engineer")).resolves.toBeUndefined();
    expect(mockSendNotification).toHaveBeenCalledTimes(2);
  });
});
