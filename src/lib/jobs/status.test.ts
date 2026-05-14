// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  canAcceptApplications,
  getJobPersistence,
  getJobStatus,
  type JobStatusRecord,
} from "@/lib/jobs";
import type { JobStatus } from "@/schemas/job";

describe("getJobStatus", () => {
  it("returns 'closed' when archived, regardless of published", () => {
    expect(getJobStatus({ archived: true, published: false })).toBe("closed");
    expect(getJobStatus({ archived: true, published: true })).toBe("closed");
  });

  it("returns 'active' when not archived and published", () => {
    expect(getJobStatus({ archived: false, published: true })).toBe("active");
  });

  it("returns 'draft' when not archived and not published", () => {
    expect(getJobStatus({ archived: false, published: false })).toBe("draft");
  });
});

describe("getJobPersistence", () => {
  it.each<[JobStatus, JobStatusRecord]>([
    ["active", { archived: false, published: true }],
    ["closed", { archived: true, published: false }],
    ["draft", { archived: false, published: false }],
  ])("maps %s -> %o", (status, expected) => {
    expect(getJobPersistence(status)).toEqual(expected);
  });

  it("defaults unknown status to draft persistence", () => {
    expect(getJobPersistence("nonsense" as unknown as JobStatus)).toEqual({
      archived: false,
      published: false,
    });
  });
});

describe("getJobStatus <-> getJobPersistence round-trip", () => {
  it.each<JobStatus>(["draft", "active", "closed"])("round-trips %s", (status) => {
    expect(getJobStatus(getJobPersistence(status))).toBe(status);
  });
});

describe("canAcceptApplications", () => {
  it("is true only for active jobs", () => {
    expect(canAcceptApplications({ archived: false, published: true })).toBe(true);
    expect(canAcceptApplications({ archived: false, published: false })).toBe(false);
    expect(canAcceptApplications({ archived: true, published: true })).toBe(false);
  });
});
