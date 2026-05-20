// @vitest-environment node
import { afterEach, describe, expect, it } from "vitest";
import { getResumeProcessingMode } from "./submit-job-application-impl";

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
