// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const { sendMock } = vi.hoisted(() => ({ sendMock: vi.fn() }));

vi.mock("pg-boss", () => {
  class FakeBoss {
    on = vi.fn();
    createQueue = vi.fn().mockResolvedValue(undefined);
    send = sendMock;
    async start() {
      return this;
    }
  }
  return { PgBoss: FakeBoss };
});

const originalDatabaseUrl = process.env.DATABASE_URL;

beforeEach(() => {
  sendMock.mockReset();
  sendMock.mockResolvedValue("job-id-1");
  process.env.DATABASE_URL = "postgresql://test/test";
  // Reset module-level state so each test gets a fresh queue singleton.
  const g = globalThis as unknown as { emailBoss?: unknown; emailBossStart?: unknown };
  delete g.emailBoss;
  delete g.emailBossStart;
});

describe("enqueueEmailJob", () => {
  it("posts to email.send with a custom email job and returns the job id", async () => {
    const { enqueueEmailJob, EMAIL_SEND_QUEUE } = await import("./emails");

    const id = await enqueueEmailJob({
      kind: "custom",
      payload: { to: "a@b.com", subject: "Hi", bodyHtml: "<p>hi</p>" },
    });

    expect(id).toBe("job-id-1");
    expect(sendMock).toHaveBeenCalledWith(
      EMAIL_SEND_QUEUE,
      {
        kind: "custom",
        payload: { to: "a@b.com", subject: "Hi", bodyHtml: "<p>hi</p>" },
      },
      expect.objectContaining({ retryLimit: 3, retryDelay: 60 }),
    );
  });
});

describe("enqueueAdminNotificationEmails", () => {
  it("enqueues one job per admin in parallel", async () => {
    const { enqueueAdminNotificationEmails } = await import("./emails");

    await enqueueAdminNotificationEmails({
      adminEmails: ["a@b.com", "c@d.com", "e@f.com"],
      jobTitle: "Backend",
      applicantName: "Sam",
      applicantEmail: "sam@example.com",
      jobUrl: "https://app/admin/jobs/1/applicants/2",
    });

    expect(sendMock).toHaveBeenCalledTimes(3);
    const recipients = sendMock.mock.calls.map((call) => call[1].payload.to);
    expect(recipients).toEqual(["a@b.com", "c@d.com", "e@f.com"]);
  });

  it("does nothing when there are no admins", async () => {
    const { enqueueAdminNotificationEmails } = await import("./emails");

    await enqueueAdminNotificationEmails({
      adminEmails: [],
      jobTitle: "Backend",
      applicantName: "Sam",
      applicantEmail: "sam@example.com",
      jobUrl: "https://app",
    });

    expect(sendMock).not.toHaveBeenCalled();
  });
});

describe("getEmailQueue bootstrap", () => {
  it("throws a descriptive error when DATABASE_URL is missing", async () => {
    delete process.env.DATABASE_URL;
    const { enqueueEmailJob } = await import("./emails");

    await expect(
      enqueueEmailJob({
        kind: "custom",
        payload: { to: "a@b.com", subject: "x", bodyHtml: "y" },
      }),
    ).rejects.toThrow(/DATABASE_URL/);
  });
});

if (originalDatabaseUrl !== undefined) {
  process.env.DATABASE_URL = originalDatabaseUrl;
}
