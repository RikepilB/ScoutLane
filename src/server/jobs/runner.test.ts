// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";

const { afterMock } = vi.hoisted(() => ({ afterMock: vi.fn() }));

vi.mock("next/server", () => ({ after: afterMock }));

import { getJobRunnerMode, runAfterResponse } from "./runner";

const originalJobRunner = process.env.JOB_RUNNER;
const originalVercel = process.env.VERCEL;

afterEach(() => {
  if (originalJobRunner === undefined) delete process.env.JOB_RUNNER;
  else process.env.JOB_RUNNER = originalJobRunner;
  if (originalVercel === undefined) delete process.env.VERCEL;
  else process.env.VERCEL = originalVercel;
  afterMock.mockReset();
});

describe("getJobRunnerMode", () => {
  it("honors JOB_RUNNER over the environment default", () => {
    process.env.JOB_RUNNER = "inline";
    delete process.env.VERCEL;
    expect(getJobRunnerMode()).toBe("inline");

    process.env.JOB_RUNNER = "worker";
    process.env.VERCEL = "1";
    expect(getJobRunnerMode()).toBe("worker");
  });

  it("defaults to inline on Vercel and worker elsewhere", () => {
    delete process.env.JOB_RUNNER;
    process.env.VERCEL = "1";
    expect(getJobRunnerMode()).toBe("inline");

    delete process.env.VERCEL;
    expect(getJobRunnerMode()).toBe("worker");
  });

  it("ignores unknown JOB_RUNNER values", () => {
    process.env.JOB_RUNNER = "banana";
    delete process.env.VERCEL;
    expect(getJobRunnerMode()).toBe("worker");
  });
});

describe("runAfterResponse", () => {
  it("schedules the task via after()", () => {
    const task = vi.fn().mockResolvedValue(undefined);
    runAfterResponse("test", task);
    expect(afterMock).toHaveBeenCalledTimes(1);
  });

  it("falls back to direct execution when after() throws", async () => {
    afterMock.mockImplementation(() => {
      throw new Error("not in a request scope");
    });
    const task = vi.fn().mockResolvedValue(undefined);

    runAfterResponse("test", task);

    expect(task).toHaveBeenCalledTimes(1);
  });

  it("swallows and logs task rejections", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    afterMock.mockImplementation((cb: () => Promise<void>) => void cb());
    const task = vi.fn().mockRejectedValue(new Error("boom"));

    runAfterResponse("test", task);
    await new Promise((resolve) => setImmediate(resolve));

    expect(consoleError).toHaveBeenCalledWith(
      "[jobs:test] inline task failed:",
      expect.any(Error),
    );
    consoleError.mockRestore();
  });
});
