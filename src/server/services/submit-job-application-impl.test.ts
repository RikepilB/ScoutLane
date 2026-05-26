// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
  jobFindUnique,
  applicantFindFirst,
  applicantCreate,
  applicantUpdate,
  pipelineStageFindFirst,
  emailLogCreate,
  uploadFileBufferMock,
  canAcceptApplicationsMock,
  enqueueResumeParseJobMock,
  enqueueAdminNotificationEmailsMock,
  sendApplicationConfirmationEmailMock,
  parseApplicantResumeFromBufferMock,
  revalidatePathMock,
} = vi.hoisted(() => ({
  jobFindUnique: vi.fn(),
  applicantFindFirst: vi.fn(),
  applicantCreate: vi.fn(),
  applicantUpdate: vi.fn(),
  pipelineStageFindFirst: vi.fn(),
  emailLogCreate: vi.fn(),
  uploadFileBufferMock: vi.fn(),
  canAcceptApplicationsMock: vi.fn(),
  enqueueResumeParseJobMock: vi.fn(),
  enqueueAdminNotificationEmailsMock: vi.fn(),
  sendApplicationConfirmationEmailMock: vi.fn(),
  parseApplicantResumeFromBufferMock: vi.fn(),
  revalidatePathMock: vi.fn(),
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    job: { findUnique: jobFindUnique },
    applicant: {
      findFirst: applicantFindFirst,
      create: applicantCreate,
      update: applicantUpdate,
    },
    pipelineStage: { findFirst: pipelineStageFindFirst },
    emailLog: { create: emailLogCreate },
  },
}));

vi.mock("@/lib/email/send", () => ({
  sendApplicationConfirmationEmail: sendApplicationConfirmationEmailMock,
}));

vi.mock("@/lib/storage/upload", () => ({
  uploadFileBuffer: uploadFileBufferMock,
}));

vi.mock("@/lib/jobs/status", () => ({
  canAcceptApplications: canAcceptApplicationsMock,
}));

vi.mock("@/lib/resume/parseApplicantResume", () => ({
  parseApplicantResumeFromBuffer: parseApplicantResumeFromBufferMock,
}));

vi.mock("@/server/queues/emails", () => ({
  enqueueAdminNotificationEmails: enqueueAdminNotificationEmailsMock,
}));

vi.mock("@/server/queues/resume", () => ({
  enqueueResumeParseJob: enqueueResumeParseJobMock,
}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
}));

import {
  getResumeProcessingMode,
  submitJobApplicationImpl,
} from "./submit-job-application-impl";

const originalMode = process.env.RESUME_PARSE_MODE;

afterEach(() => {
  if (originalMode === undefined) {
    delete process.env.RESUME_PARSE_MODE;
  } else {
    process.env.RESUME_PARSE_MODE = originalMode;
  }
});

describe("resume processing mode", () => {
  it("keeps queued parsing as the default", () => {
    delete process.env.RESUME_PARSE_MODE;
    expect(getResumeProcessingMode()).toBe("queue");
  });

  it("allows explicit inline parsing for local diagnostics", () => {
    process.env.RESUME_PARSE_MODE = "inline";
    expect(getResumeProcessingMode()).toBe("inline");
  });

  it("falls back to queued parsing for invalid values", () => {
    process.env.RESUME_PARSE_MODE = "unknown";
    expect(getResumeProcessingMode()).toBe("queue");
  });
});

function buildFormData(overrides: Partial<{ jobSlug: string; email: string }> = {}): FormData {
  const fd = new FormData();
  fd.set("firstName", "Sam");
  fd.set("lastName", "Smith");
  fd.set("email", overrides.email ?? "sam@example.com");
  fd.set("phone", "+1 555 0100");
  fd.set("jobSlug", overrides.jobSlug ?? "backend-engineer");
  fd.set(
    "resumeFile",
    new File([new Uint8Array([0x25, 0x50, 0x44, 0x46])], "resume.pdf", {
      type: "application/pdf",
    }),
  );
  return fd;
}

function seedHappyPath(admins: string[] = ["admin@example.com"]) {
  jobFindUnique.mockResolvedValue({
    id: "job-1",
    title: "Backend Engineer",
    slug: "backend-engineer",
    customFields: [],
    archived: false,
    published: true,
    organization: { id: "org-1", users: admins.map((email) => ({ email })) },
  });
  canAcceptApplicationsMock.mockReturnValue(true);
  uploadFileBufferMock.mockResolvedValue({ url: "/uploads/resume.pdf" });
  applicantFindFirst.mockResolvedValue(null);
  pipelineStageFindFirst.mockResolvedValue({ id: "stage-1" });
  applicantCreate.mockResolvedValue({ id: "applicant-1" });
  applicantUpdate.mockResolvedValue({});
  enqueueResumeParseJobMock.mockResolvedValue("resume-job-1");
  enqueueAdminNotificationEmailsMock.mockResolvedValue(undefined);
  sendApplicationConfirmationEmailMock.mockResolvedValue({ ok: true, id: "conf-1" });
  parseApplicantResumeFromBufferMock.mockResolvedValue(undefined);
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.RESUME_PARSE_MODE = "queue";
});

describe("submitJobApplicationImpl — admin fan-out via queue (Codex fix)", () => {
  it("returns success and does NOT call the admin email helper synchronously", async () => {
    seedHappyPath(["a@example.com", "b@example.com", "c@example.com"]);

    const result = await submitJobApplicationImpl(buildFormData());

    expect(result.success).toBe(true);
    expect(enqueueAdminNotificationEmailsMock).toHaveBeenCalledTimes(1);
    expect(enqueueAdminNotificationEmailsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        adminEmails: ["a@example.com", "b@example.com", "c@example.com"],
        applicantName: "Sam Smith",
        jobTitle: "Backend Engineer",
      }),
    );
  });

  it("returns success even when the email queue is unreachable", async () => {
    seedHappyPath();
    enqueueAdminNotificationEmailsMock.mockRejectedValue(new Error("pg-boss down"));

    const result = await submitJobApplicationImpl(buildFormData());

    expect(result.success).toBe(true);
  });

  it("skips the admin queue call when no admins exist on the organization", async () => {
    seedHappyPath([]);

    const result = await submitJobApplicationImpl(buildFormData());

    expect(result.success).toBe(true);
    expect(enqueueAdminNotificationEmailsMock).not.toHaveBeenCalled();
  });

  it("warns the applicant when the confirmation email could not be delivered", async () => {
    seedHappyPath();
    sendApplicationConfirmationEmailMock.mockResolvedValue({
      ok: false,
      skipped: false,
      error: "Domain not verified",
    });

    const result = await submitJobApplicationImpl(buildFormData());

    expect(result.success).toBe(true);
    expect(result.warning).toContain("confirmation email could not be sent");
  });

  it("warns the applicant when the confirmation email is skipped (RESEND_API_KEY missing)", async () => {
    seedHappyPath();
    sendApplicationConfirmationEmailMock.mockResolvedValue({ ok: false, skipped: true });

    const result = await submitJobApplicationImpl(buildFormData());

    expect(result.success).toBe(true);
    expect(result.warning).toContain("confirmation email could not be sent");
  });
});
