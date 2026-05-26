// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  findUniqueMock,
  requireSessionMock,
  sendCustomEmailMock,
  revalidatePathMock,
} = vi.hoisted(() => ({
  findUniqueMock: vi.fn(),
  requireSessionMock: vi.fn(),
  sendCustomEmailMock: vi.fn(),
  revalidatePathMock: vi.fn(),
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    applicant: { findUnique: findUniqueMock },
  },
}));

vi.mock("@/lib/email/send", () => ({
  sendCustomEmail: sendCustomEmailMock,
}));

vi.mock("@/server/services/_lib/validate-session", () => ({
  requireSession: requireSessionMock,
}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
}));

import { sendApplicantEmailImpl } from "./send-applicant-impl";

beforeEach(() => {
  findUniqueMock.mockReset();
  requireSessionMock.mockReset();
  sendCustomEmailMock.mockReset();
  revalidatePathMock.mockReset();
});

function seedSession() {
  requireSessionMock.mockResolvedValue({ id: "user-1", organizationId: "org-1" });
}

function seedApplicant(overrides: Partial<{ email: string | null; organizationId: string }> = {}) {
  findUniqueMock.mockResolvedValue({
    id: "applicant-1",
    email: overrides.email === undefined ? "applicant@example.com" : overrides.email,
    jobId: "job-1",
    job: { organizationId: overrides.organizationId ?? "org-1" },
  });
}

describe("sendApplicantEmailImpl", () => {
  it("returns ok:true and revalidates the applicant path on success", async () => {
    seedSession();
    seedApplicant();
    sendCustomEmailMock.mockResolvedValue({ ok: true, skipped: false, id: "msg-1" });

    const result = await sendApplicantEmailImpl({
      applicantId: "applicant-1",
      subject: "Welcome",
      bodyHtml: "<p>Hi</p>",
    });

    expect(result).toEqual({ ok: true });
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin/jobs/job-1/applicants/applicant-1");
  });

  it("returns ok:false with the provider error when Resend returns an error-union (Codex fix)", async () => {
    seedSession();
    seedApplicant();
    sendCustomEmailMock.mockResolvedValue({ ok: false, skipped: false, error: "Domain not verified" });

    const result = await sendApplicantEmailImpl({
      applicantId: "applicant-1",
      subject: "Welcome",
      bodyHtml: "<p>Hi</p>",
    });

    expect(result).toEqual({ ok: false, error: "Domain not verified" });
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });

  it("returns ok:false with skipped flag when the email service is unconfigured", async () => {
    seedSession();
    seedApplicant();
    sendCustomEmailMock.mockResolvedValue({ ok: false, skipped: true });

    const result = await sendApplicantEmailImpl({
      applicantId: "applicant-1",
      subject: "Welcome",
      bodyHtml: "<p>Hi</p>",
    });

    expect(result.ok).toBe(false);
    expect(result.skipped).toBe(true);
    expect(result.error).toContain("not configured");
  });

  it("rejects when the applicant belongs to a different organization", async () => {
    seedSession();
    seedApplicant({ organizationId: "other-org" });

    const result = await sendApplicantEmailImpl({
      applicantId: "applicant-1",
      subject: "Welcome",
      bodyHtml: "<p>Hi</p>",
    });

    expect(result).toEqual({ ok: false, error: "Applicant not found" });
    expect(sendCustomEmailMock).not.toHaveBeenCalled();
  });

  it("rejects when the applicant has no email on file", async () => {
    seedSession();
    seedApplicant({ email: null });

    const result = await sendApplicantEmailImpl({
      applicantId: "applicant-1",
      subject: "Welcome",
      bodyHtml: "<p>Hi</p>",
    });

    expect(result).toEqual({ ok: false, error: "Applicant has no email on file" });
    expect(sendCustomEmailMock).not.toHaveBeenCalled();
  });

  it("rejects when subject is missing", async () => {
    seedSession();
    seedApplicant();

    const result = await sendApplicantEmailImpl({
      applicantId: "applicant-1",
      subject: "",
      bodyHtml: "<p>Hi</p>",
    });

    expect(result.ok).toBe(false);
    expect(result.error).toBeDefined();
    expect(sendCustomEmailMock).not.toHaveBeenCalled();
  });
});
