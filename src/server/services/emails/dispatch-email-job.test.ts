import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockAdminNewApplication,
  mockApplicantConfirmation,
  mockCustom,
  mockJobAlertConfirmation,
  mockNewJobNotification,
} = vi.hoisted(() => ({
  mockAdminNewApplication: vi.fn(),
  mockApplicantConfirmation: vi.fn(),
  mockCustom: vi.fn(),
  mockJobAlertConfirmation: vi.fn(),
  mockNewJobNotification: vi.fn(),
}));

vi.mock("@/lib/email/send", () => ({
  sendAdminNewApplicationEmail: mockAdminNewApplication,
  sendApplicationConfirmationEmail: mockApplicantConfirmation,
  sendCustomEmail: mockCustom,
  sendJobAlertConfirmation: mockJobAlertConfirmation,
  sendNewJobNotification: mockNewJobNotification,
}));

import { dispatchEmailJob } from "./dispatch-email-job";
import type { EmailJob } from "@/server/queues/emails";

const ok = { ok: true as const };

beforeEach(() => {
  mockAdminNewApplication.mockReset().mockResolvedValue(ok);
  mockApplicantConfirmation.mockReset().mockResolvedValue(ok);
  mockCustom.mockReset().mockResolvedValue(ok);
  mockJobAlertConfirmation.mockReset().mockResolvedValue(ok);
  mockNewJobNotification.mockReset().mockResolvedValue(ok);
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("dispatchEmailJob", () => {
  it("routes admin-new-application with its payload", async () => {
    const job: EmailJob = {
      kind: "admin-new-application",
      payload: {
        to: "admin@x.com",
        jobTitle: "Engineer",
        applicantName: "Ada",
        applicantEmail: "ada@x.com",
        jobUrl: "https://x.com/jobs/eng",
      },
    };
    const result = await dispatchEmailJob(job);
    expect(mockAdminNewApplication).toHaveBeenCalledWith(job.payload);
    expect(result).toBe(ok);
  });

  it("routes applicant-confirmation with its payload", async () => {
    const job: EmailJob = {
      kind: "applicant-confirmation",
      payload: { to: "ada@x.com", applicantName: "Ada", jobTitle: "Engineer" },
    };
    await dispatchEmailJob(job);
    expect(mockApplicantConfirmation).toHaveBeenCalledWith(job.payload);
  });

  it("routes custom with its payload", async () => {
    const job: EmailJob = {
      kind: "custom",
      payload: { to: "ada@x.com", subject: "Hi", bodyHtml: "<p>Hi</p>" },
    };
    await dispatchEmailJob(job);
    expect(mockCustom).toHaveBeenCalledWith(job.payload);
  });

  it("routes job-alert-confirmation with positional (to, token) args", async () => {
    const job: EmailJob = {
      kind: "job-alert-confirmation",
      payload: { to: "ada@x.com", token: "tok-1" },
    };
    await dispatchEmailJob(job);
    expect(mockJobAlertConfirmation).toHaveBeenCalledWith("ada@x.com", "tok-1");
  });

  it("routes new-job-notification with positional args", async () => {
    const job: EmailJob = {
      kind: "new-job-notification",
      payload: {
        to: "ada@x.com",
        jobTitle: "Engineer",
        jobUrl: "https://x.com/jobs/eng",
        token: "tok-2",
      },
    };
    await dispatchEmailJob(job);
    expect(mockNewJobNotification).toHaveBeenCalledWith(
      "ada@x.com",
      "Engineer",
      "https://x.com/jobs/eng",
      "tok-2",
    );
  });
});
