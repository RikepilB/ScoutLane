// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { sendMock, emailLogCreateMock } = vi.hoisted(() => ({
  sendMock: vi.fn(),
  emailLogCreateMock: vi.fn(),
}));

vi.mock("./client", () => ({
  getResendClientOrNull: () => ({
    emails: { send: sendMock },
  }),
  getEmailFromOrNull: () => "test@scoutlane.example",
  isEmailConfigured: () => true,
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    emailLog: { create: emailLogCreateMock },
  },
}));

import {
  buildApplicationConfirmationEmail,
  sendApplicationConfirmationEmail,
  sendCustomEmail,
} from "./send";

beforeEach(() => {
  sendMock.mockReset();
  emailLogCreateMock.mockReset();
  emailLogCreateMock.mockResolvedValue({});
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("sendCustomEmail", () => {
  it("returns ok:true and logs status=200 on Resend success", async () => {
    sendMock.mockResolvedValue({ data: { id: "abc-123" }, error: null });

    const result = await sendCustomEmail({
      to: "applicant@example.com",
      subject: "Hello",
      bodyHtml: "<p>hi</p>",
    });

    expect(result).toEqual({ ok: true, skipped: false, id: "abc-123" });
    expect(emailLogCreateMock).toHaveBeenCalledWith({
      data: {
        to: "applicant@example.com",
        subject: "Hello",
        status: 200,
        error: null,
      },
    });
  });

  it("returns ok:false and logs status=0 when Resend returns an error-union (Codex fix)", async () => {
    sendMock.mockResolvedValue({
      data: null,
      error: { message: "Domain not verified", name: "validation_error", statusCode: 422 },
    });

    const result = await sendCustomEmail({
      to: "applicant@example.com",
      subject: "Hello",
      bodyHtml: "<p>hi</p>",
    });

    expect(result).toEqual({ ok: false, skipped: false, error: "Domain not verified" });
    expect(emailLogCreateMock).toHaveBeenCalledWith({
      data: {
        to: "applicant@example.com",
        subject: "Hello",
        status: 0,
        error: "Domain not verified",
      },
    });
  });

  it("returns ok:false when Resend throws unexpectedly", async () => {
    sendMock.mockRejectedValue(new Error("ECONNRESET"));

    const result = await sendCustomEmail({
      to: "applicant@example.com",
      subject: "Hello",
      bodyHtml: "<p>hi</p>",
    });

    expect(result).toEqual({ ok: false, skipped: false, error: "ECONNRESET" });
    expect(emailLogCreateMock).toHaveBeenCalledWith({
      data: expect.objectContaining({ status: 0, error: "ECONNRESET" }),
    });
  });

  it("returns ok:false when Resend returns neither data nor error", async () => {
    sendMock.mockResolvedValue({ data: null, error: null });

    const result = await sendCustomEmail({
      to: "applicant@example.com",
      subject: "Hello",
      bodyHtml: "<p>hi</p>",
    });

    expect(result).toEqual({
      ok: false,
      skipped: false,
      error: "Resend returned no data and no error",
    });
  });
});

describe("buildApplicationConfirmationEmail", () => {
  it("includes the job title in the subject", () => {
    const built = buildApplicationConfirmationEmail({
      applicantName: "Sam",
      jobTitle: "Backend Engineer",
    });
    expect(built.subject).toBe("Application received for Backend Engineer");
  });

  it("escapes HTML in applicant name and job title to prevent injection", () => {
    const built = buildApplicationConfirmationEmail({
      applicantName: "<script>alert('xss')</script>",
      jobTitle: "<img onerror=alert(1)>",
    });
    expect(built.html).not.toContain("<script>alert");
    expect(built.html).not.toContain("<img onerror");
    expect(built.html).toContain("&lt;script&gt;alert");
    expect(built.html).toContain("&lt;img onerror=alert(1)&gt;");
  });
});

describe("sendApplicationConfirmationEmail", () => {
  it("propagates the normalized result from the provider", async () => {
    sendMock.mockResolvedValue({ data: { id: "conf-1" }, error: null });

    const result = await sendApplicationConfirmationEmail({
      applicantName: "Sam",
      jobTitle: "Backend Engineer",
      to: "sam@example.com",
    });

    expect(result).toEqual({ ok: true, skipped: false, id: "conf-1" });
  });
});

describe("error scrubbing + truncation", () => {
  it("redacts secret-like patterns from Resend error messages before persisting", async () => {
    sendMock.mockResolvedValue({
      data: null,
      error: {
        message: "Auth failed: api_key=sk-or-v1-aaaaaaaaaaaaaaaaaaaaaaaa is invalid",
        statusCode: 401,
      },
    });

    const result = await sendCustomEmail({
      to: "applicant@example.com",
      subject: "Hello",
      bodyHtml: "<p>hi</p>",
    });

    expect(result.ok).toBe(false);
    if (!result.ok && !result.skipped) {
      expect(result.error).not.toContain("sk-or-v1-");
      expect(result.error).toContain("[REDACTED]");
    }
    const logCall = emailLogCreateMock.mock.calls.find(
      (call) => call[0]?.data?.to === "applicant@example.com",
    );
    expect(logCall![0].data.error).not.toContain("sk-or-v1-");
  });

  it("truncates excessively long error messages", async () => {
    const huge = "X".repeat(2000);
    sendMock.mockResolvedValue({ data: null, error: { message: huge } });

    const result = await sendCustomEmail({
      to: "a@b.com",
      subject: "Hi",
      bodyHtml: "<p>x</p>",
    });

    if (!result.ok && !result.skipped) {
      expect(result.error.length).toBeLessThanOrEqual(600);
      expect(result.error).toContain("[truncated]");
    } else {
      throw new Error("expected an error result");
    }
  });

  it("does not JSON.stringify the raw error object (avoids leaking headers and tokens)", async () => {
    sendMock.mockResolvedValue({
      data: null,
      error: {
        statusCode: 500,
        headers: { authorization: "Bearer secrettokenvaluethatshouldnotleak" },
      },
    });

    const result = await sendCustomEmail({
      to: "a@b.com",
      subject: "Hi",
      bodyHtml: "<p>x</p>",
    });

    if (!result.ok && !result.skipped) {
      expect(result.error).not.toContain("authorization");
      expect(result.error).not.toContain("secrettokenvalue");
    }
  });
});
