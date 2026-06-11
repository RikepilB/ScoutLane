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
  enqueueEmailJobMock,
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
  enqueueEmailJobMock: vi.fn(),
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

vi.mock("@/lib/storage/upload", () => ({
  uploadFileBuffer: uploadFileBufferMock,
}));

vi.mock("@/lib/jobs/status", () => ({
  canAcceptApplications: canAcceptApplicationsMock,
}));

vi.mock("@/lib/resume/parseApplicantResume", () => ({
  parseApplicantResumeFromBuffer: parseApplicantResumeFromBufferMock,
}));

// The impl now routes background work through the job dispatcher, which
// either enqueues to pg-boss (worker mode) or runs inline via after().
vi.mock("@/server/jobs/dispatch", () => ({
  dispatchAdminNotificationEmails: enqueueAdminNotificationEmailsMock,
  dispatchEmail: enqueueEmailJobMock,
  dispatchResumeParse: enqueueResumeParseJobMock,
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
  it("defaults to async queue parsing so the applicant never waits", () => {
    delete process.env.RESUME_PARSE_MODE;
    expect(getResumeProcessingMode()).toBe("queue");
  });

  it("allows explicit inline parsing for local diagnostics", () => {
    process.env.RESUME_PARSE_MODE = "inline";
    expect(getResumeProcessingMode()).toBe("inline");
  });

  it("allows explicit queue-and-inline parsing", () => {
    process.env.RESUME_PARSE_MODE = "queue-and-inline";
    expect(getResumeProcessingMode()).toBe("queue-and-inline");
  });

  it("falls back to async queue parsing for invalid values", () => {
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
  enqueueAdminNotificationEmailsMock.mockResolvedValue({
    enqueued: admins,
    failed: [],
  });
  enqueueEmailJobMock.mockResolvedValue("conf-job-1");
  parseApplicantResumeFromBufferMock.mockResolvedValue(undefined);
  emailLogCreate.mockResolvedValue({});
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

  it("enqueues the applicant confirmation via pg-boss instead of awaiting Resend in the request path", async () => {
    seedHappyPath();

    await submitJobApplicationImpl(buildFormData());

    expect(enqueueEmailJobMock).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: "applicant-confirmation",
        payload: expect.objectContaining({
          to: "sam@example.com",
          applicantName: "Sam Smith",
          jobTitle: "Backend Engineer",
        }),
      }),
    );
  });

  it("warns the applicant and writes an EmailLog row when confirmation enqueue fails", async () => {
    seedHappyPath();
    enqueueEmailJobMock.mockRejectedValueOnce(new Error("pg-boss down"));

    const result = await submitJobApplicationImpl(buildFormData());

    expect(result.success).toBe(true);
    expect(result.warning).toContain("could not be queued");
    expect(emailLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          to: "sam@example.com",
          status: 0,
          error: expect.stringContaining("ENQUEUE_FAILED"),
        }),
      }),
    );
  });

  it("writes an EmailLog row for each admin enqueue failure surfaced by enqueueAdminNotificationEmails", async () => {
    seedHappyPath(["a@example.com", "b@example.com"]);
    enqueueAdminNotificationEmailsMock.mockResolvedValue({
      enqueued: ["a@example.com"],
      failed: [{ to: "b@example.com", error: "boom" }],
    });

    await submitJobApplicationImpl(buildFormData());

    const adminLogCall = emailLogCreate.mock.calls.find(
      (call) => call[0]?.data?.to === "b@example.com",
    );
    expect(adminLogCall).toBeDefined();
    expect(adminLogCall![0].data.error).toContain("ENQUEUE_FAILED");
  });
});
