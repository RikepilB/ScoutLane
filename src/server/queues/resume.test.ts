// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const { sendMock, startMock } = vi.hoisted(() => ({
  sendMock: vi.fn(),
  startMock: vi.fn(),
}));

vi.mock("pg-boss", () => {
  class FakeBoss {
    on = vi.fn();
    createQueue = vi.fn().mockResolvedValue(undefined);
    send = sendMock;
    start = startMock;
  }
  return { PgBoss: FakeBoss };
});

vi.mock("@/lib/db/prisma", () => ({
  prisma: { applicant: { update: vi.fn().mockResolvedValue({}) } },
}));

const originalDatabaseUrl = process.env.DATABASE_URL;

beforeEach(() => {
  sendMock.mockReset();
  sendMock.mockResolvedValue("job-id-1");
  startMock.mockReset();
  startMock.mockImplementation(function (this: unknown) {
    return Promise.resolve(this);
  });
  process.env.DATABASE_URL = "postgresql://test/test";
  const g = globalThis as unknown as { resumeBoss?: unknown; resumeBossStart?: unknown };
  delete g.resumeBoss;
  delete g.resumeBossStart;
});

describe("enqueueResumeParseJob", () => {
  it("posts to resume.parse and returns the job id", async () => {
    const { enqueueResumeParseJob, RESUME_PARSE_QUEUE } = await import("./resume");

    const id = await enqueueResumeParseJob({ applicantId: "a1", resumeUrl: "https://x/y.pdf" });

    expect(id).toBe("job-id-1");
    expect(sendMock).toHaveBeenCalledWith(
      RESUME_PARSE_QUEUE,
      { applicantId: "a1", resumeUrl: "https://x/y.pdf" },
      expect.objectContaining({ singletonKey: "a1", retryLimit: 3 }),
    );
  });
});

describe("getResumeQueue bootstrap", () => {
  it("throws a descriptive error when DATABASE_URL is missing", async () => {
    delete process.env.DATABASE_URL;
    const { getResumeQueue } = await import("./resume");

    await expect(getResumeQueue()).rejects.toThrow(/DATABASE_URL/);
  });

  it("does not cache a failed start — a later call can retry and succeed", async () => {
    startMock.mockRejectedValueOnce(new Error("connection refused"));
    const { getResumeQueue } = await import("./resume");

    await expect(getResumeQueue()).rejects.toThrow("connection refused");

    // Give the .catch() cleanup a tick to run before the next call.
    await new Promise((resolve) => setTimeout(resolve, 0));

    const boss = await getResumeQueue();
    expect(boss).toBeDefined();
    expect(startMock).toHaveBeenCalledTimes(2);
  });
});

if (originalDatabaseUrl !== undefined) {
  process.env.DATABASE_URL = originalDatabaseUrl;
}
