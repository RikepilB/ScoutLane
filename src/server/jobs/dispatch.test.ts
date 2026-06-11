// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
  enqueueResumeParseJobMock,
  enqueueEmailJobMock,
  enqueueAdminNotificationEmailsMock,
  dispatchEmailJobMock,
  parseFromBufferMock,
  parseFromUrlMock,
} = vi.hoisted(() => ({
  enqueueResumeParseJobMock: vi.fn(),
  enqueueEmailJobMock: vi.fn(),
  enqueueAdminNotificationEmailsMock: vi.fn(),
  dispatchEmailJobMock: vi.fn(),
  parseFromBufferMock: vi.fn(),
  parseFromUrlMock: vi.fn(),
}));

vi.mock("next/server", () => ({
  after: vi.fn((cb: () => Promise<void>) => void cb()),
}));

vi.mock("@/server/queues/resume", () => ({
  enqueueResumeParseJob: enqueueResumeParseJobMock,
}));

vi.mock("@/server/queues/emails", () => ({
  enqueueEmailJob: enqueueEmailJobMock,
  enqueueAdminNotificationEmails: enqueueAdminNotificationEmailsMock,
}));

vi.mock("@/server/services/emails/dispatch-email-job", () => ({
  dispatchEmailJob: dispatchEmailJobMock,
}));

vi.mock("@/lib/resume/parseApplicantResume", () => ({
  parseApplicantResumeFromBuffer: parseFromBufferMock,
  parseApplicantResumeFromUrl: parseFromUrlMock,
}));

import {
  dispatchAdminNotificationEmails,
  dispatchEmail,
  dispatchResumeParse,
} from "./dispatch";
import type { EmailJob } from "@/server/queues/emails";

const originalJobRunner = process.env.JOB_RUNNER;

const confirmationJob: EmailJob = {
  kind: "applicant-confirmation",
  payload: { to: "jane@example.com", applicantName: "Jane", jobTitle: "Engineer" },
};

beforeEach(() => {
  vi.clearAllMocks();
  dispatchEmailJobMock.mockResolvedValue({ ok: true, skipped: false });
  parseFromBufferMock.mockResolvedValue(undefined);
  parseFromUrlMock.mockResolvedValue(undefined);
  enqueueResumeParseJobMock.mockResolvedValue("job-1");
  enqueueEmailJobMock.mockResolvedValue("job-2");
  enqueueAdminNotificationEmailsMock.mockResolvedValue({ enqueued: ["a@x.com"], failed: [] });
});

afterEach(() => {
  if (originalJobRunner === undefined) delete process.env.JOB_RUNNER;
  else process.env.JOB_RUNNER = originalJobRunner;
});

async function flushInlineTasks(): Promise<void> {
  await new Promise((resolve) => setImmediate(resolve));
}

describe("dispatchResumeParse", () => {
  it("enqueues to pg-boss in worker mode", async () => {
    process.env.JOB_RUNNER = "worker";

    await dispatchResumeParse({ applicantId: "a1", resumeUrl: "/api/resumes/r.pdf" });

    expect(enqueueResumeParseJobMock).toHaveBeenCalledWith({
      applicantId: "a1",
      resumeUrl: "/api/resumes/r.pdf",
    });
    expect(parseFromBufferMock).not.toHaveBeenCalled();
    expect(parseFromUrlMock).not.toHaveBeenCalled();
  });

  it("parses from the buffer inline when provided", async () => {
    process.env.JOB_RUNNER = "inline";
    const buffer = Buffer.from("pdf");

    await dispatchResumeParse({
      applicantId: "a1",
      resumeUrl: "/api/resumes/r.pdf",
      buffer,
      filename: "r.pdf",
    });
    await flushInlineTasks();

    expect(parseFromBufferMock).toHaveBeenCalledWith("a1", buffer, "r.pdf");
    expect(enqueueResumeParseJobMock).not.toHaveBeenCalled();
  });

  it("parses from the URL inline when no buffer is provided", async () => {
    process.env.JOB_RUNNER = "inline";

    await dispatchResumeParse({ applicantId: "a1", resumeUrl: "/api/resumes/r.pdf" });
    await flushInlineTasks();

    expect(parseFromUrlMock).toHaveBeenCalledWith("a1", "/api/resumes/r.pdf");
  });
});

describe("dispatchEmail", () => {
  it("enqueues in worker mode", async () => {
    process.env.JOB_RUNNER = "worker";

    await dispatchEmail(confirmationJob);

    expect(enqueueEmailJobMock).toHaveBeenCalledWith(confirmationJob);
    expect(dispatchEmailJobMock).not.toHaveBeenCalled();
  });

  it("sends inline in inline mode", async () => {
    process.env.JOB_RUNNER = "inline";

    await dispatchEmail(confirmationJob);
    await flushInlineTasks();

    expect(dispatchEmailJobMock).toHaveBeenCalledWith(confirmationJob);
    expect(enqueueEmailJobMock).not.toHaveBeenCalled();
  });
});

describe("dispatchAdminNotificationEmails", () => {
  const input = {
    adminEmails: ["a@x.com", "b@x.com"],
    jobTitle: "Engineer",
    applicantName: "Jane",
    applicantEmail: "jane@example.com",
    jobUrl: "https://app/admin/jobs/1",
  };

  it("delegates to the queue fan-out in worker mode", async () => {
    process.env.JOB_RUNNER = "worker";

    const result = await dispatchAdminNotificationEmails(input);

    expect(enqueueAdminNotificationEmailsMock).toHaveBeenCalledWith(input);
    expect(result).toEqual({ enqueued: ["a@x.com"], failed: [] });
  });

  it("sends one inline email per admin in inline mode", async () => {
    process.env.JOB_RUNNER = "inline";

    const result = await dispatchAdminNotificationEmails(input);
    await flushInlineTasks();

    expect(dispatchEmailJobMock).toHaveBeenCalledTimes(2);
    expect(dispatchEmailJobMock).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: "admin-new-application",
        payload: expect.objectContaining({ to: "a@x.com" }),
      }),
    );
    expect(result).toEqual({ enqueued: ["a@x.com", "b@x.com"], failed: [] });
  });
});
