// @vitest-environment node
import { describe, expect, it } from "vitest";
import { buildJobSlug } from "@/lib/slug";

const SUFFIX = /-[0-9a-f]{8}$/;

describe("buildJobSlug", () => {
  it("produces '<kebab-title>-<8-hex>'", () => {
    const result = buildJobSlug("Frontend Engineer");
    expect(result).toMatch(/^frontend-engineer-[0-9a-f]{8}$/);
  });

  it("caps the slug body at 60 characters before adding suffix", () => {
    const longTitle = "A".repeat(200);
    const result = buildJobSlug(longTitle);
    expect(result.length).toBe(69);
    expect(result).toMatch(SUFFIX);
  });

  it("falls back to 'job' when title is empty", () => {
    expect(buildJobSlug("")).toMatch(/^job-[0-9a-f]{8}$/);
  });

  it("falls back to 'job' when title has no slug-able characters", () => {
    expect(buildJobSlug("!!! ???")).toMatch(/^job-[0-9a-f]{8}$/);
  });

  it("produces a different suffix on each call for the same title", () => {
    const a = buildJobSlug("Same Title");
    const b = buildJobSlug("Same Title");
    expect(a).not.toBe(b);
    expect(a).toMatch(SUFFIX);
    expect(b).toMatch(SUFFIX);
  });
});
