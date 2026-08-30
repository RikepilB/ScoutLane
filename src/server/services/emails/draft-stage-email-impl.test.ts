// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const { findUniqueMock, requireSessionMock, draftStageEmailMock } = vi.hoisted(() => ({
  findUniqueMock: vi.fn(),
  requireSessionMock: vi.fn(),
  draftStageEmailMock: vi.fn(),
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    applicant: { findUnique: findUniqueMock },
  },
}));

vi.mock("@/lib/llm/draftStageEmail", () => ({
  draftStageEmail: draftStageEmailMock,
}));

vi.mock("@/server/services/_lib/validate-session", () => ({
  requireSession: requireSessionMock,
}));

import { draftStageEmailImpl } from "./draft-stage-email-impl";

beforeEach(() => {
  findUniqueMock.mockReset();
  requireSessionMock.mockReset();
  draftStageEmailMock.mockReset();
});

function seedSession(role = "ADMIN") {
  requireSessionMock.mockResolvedValue({
    id: "user-1",
    email: "admin@example.com",
    role,
    organizationId: "org-1",
  });
}

function seedApplicant(overrides: Partial<{ organizationId: string; status: string }> = {}) {
  findUniqueMock.mockResolvedValue({
    name: "Jamie Rivera",
    status: overrides.status ?? "INTERVIEW",
    parsedData: { skills: ["TypeScript"], workHistory: [] },
    job: { title: "Senior Engineer", organizationId: overrides.organizationId ?? "org-1" },
  });
}

describe("draftStageEmailImpl", () => {
  it("returns the drafted subject/body on success", async () => {
    seedSession();
    seedApplicant();
    draftStageEmailMock.mockResolvedValue({
      subject: "Let's schedule your interview",
      bodyHtml: "<p>Hi Jamie</p>",
    });

    const result = await draftStageEmailImpl("applicant-1");

    expect(result).toEqual({
      ok: true,
      subject: "Let's schedule your interview",
      bodyHtml: "<p>Hi Jamie</p>",
    });
    expect(draftStageEmailMock).toHaveBeenCalledWith({
      applicantName: "Jamie Rivera",
      jobTitle: "Senior Engineer",
      targetStatus: "INTERVIEW",
      parsedResume: { skills: ["TypeScript"], workHistory: [] },
    });
  });

  it("rejects when the session user has no allowed role", async () => {
    seedSession("VIEWER");
    seedApplicant();

    const result = await draftStageEmailImpl("applicant-1");

    expect(result).toEqual({ ok: false, error: "You do not have permission to draft emails" });
    expect(draftStageEmailMock).not.toHaveBeenCalled();
  });

  it("rejects when the applicant belongs to a different organization", async () => {
    seedSession();
    seedApplicant({ organizationId: "other-org" });

    const result = await draftStageEmailImpl("applicant-1");

    expect(result).toEqual({ ok: false, error: "Applicant not found" });
    expect(draftStageEmailMock).not.toHaveBeenCalled();
  });

  it("rejects when the applicant does not exist", async () => {
    seedSession();
    findUniqueMock.mockResolvedValue(null);

    const result = await draftStageEmailImpl("applicant-1");

    expect(result).toEqual({ ok: false, error: "Applicant not found" });
  });

  it("returns an error when OpenRouter is not configured", async () => {
    seedSession();
    seedApplicant();
    draftStageEmailMock.mockResolvedValue(null);

    const result = await draftStageEmailImpl("applicant-1");

    expect(result.ok).toBe(false);
    expect(result.error).toContain("not configured");
  });
});
