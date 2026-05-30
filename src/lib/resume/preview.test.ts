import { describe, expect, it } from "vitest";
import { canEmbedResume } from "@/lib/resume/preview";

describe("canEmbedResume", () => {
  it("embeds PDFs by content type even when the URL has no extension", () => {
    expect(
      canEmbedResume({ contentType: "application/pdf", pathname: "/api/resumes/abc123" }),
    ).toBe(true);
  });

  it("embeds csv and plain text by content type", () => {
    expect(canEmbedResume({ contentType: "text/csv" })).toBe(true);
    expect(canEmbedResume({ contentType: "text/plain" })).toBe(true);
  });

  it("does NOT embed Word documents", () => {
    expect(
      canEmbedResume({
        contentType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      }),
    ).toBe(false);
    expect(canEmbedResume({ contentType: "application/msword" })).toBe(false);
  });

  it("ignores charset parameters on the content type", () => {
    expect(canEmbedResume({ contentType: "application/pdf; charset=binary" })).toBe(true);
  });

  it("falls back to the extension when content type is unknown", () => {
    expect(canEmbedResume({ contentType: null, pathname: "/files/resume.pdf" })).toBe(true);
    expect(canEmbedResume({ contentType: undefined, pathname: "/files/resume.docx" })).toBe(
      false,
    );
  });

  it("returns false when neither content type nor a known extension is available", () => {
    expect(canEmbedResume({})).toBe(false);
    expect(canEmbedResume({ contentType: "", pathname: "/files/resume" })).toBe(false);
  });
});
