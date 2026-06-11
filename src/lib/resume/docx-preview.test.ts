// @vitest-environment node
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";

import { convertDocxToSafeHtml } from "./docx-preview";

const FIXTURE_DOCX = join(__dirname, "__fixtures__", "sample-resume.docx");

describe("convertDocxToSafeHtml", () => {
  it("converts the committed DOCX fixture to an HTML document", async () => {
    const html = await convertDocxToSafeHtml(readFileSync(FIXTURE_DOCX));

    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("SCOUTLANE DOCX FIXTURE");
    expect(html).toContain("Skills: TypeScript, SQL, Python");
  });

  it("strips scripts, event handlers, and javascript: links", async () => {
    vi.doMock("mammoth", () => ({
      default: {
        convertToHtml: vi.fn().mockResolvedValue({
          value:
            '<p onclick="alert(1)">hi</p><script>alert(2)</script>' +
            '<a href="javascript:alert(3)">bad</a><a href="https://example.com">ok</a>' +
            '<img src="x" onerror="alert(4)" />',
        }),
      },
    }));
    vi.resetModules();
    const { convertDocxToSafeHtml: convert } = await import("./docx-preview");

    const html = await convert(Buffer.from("ignored"));

    expect(html).not.toContain("<script");
    expect(html).not.toContain("onclick");
    expect(html).not.toContain("javascript:");
    expect(html).not.toContain("<img");
    expect(html).toContain('href="https://example.com"');
    expect(html).toContain('rel="noreferrer"');

    vi.doUnmock("mammoth");
    vi.resetModules();
  });
});
