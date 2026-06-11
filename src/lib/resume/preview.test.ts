import { describe, expect, it } from "vitest";
import { canEmbedResume, getResumePreviewKind } from "@/lib/resume/preview";

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

describe("getResumePreviewKind", () => {
  const DOCX_MIME =
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

  it("returns native for embeddable content types", () => {
    expect(getResumePreviewKind({ contentType: "application/pdf" })).toBe("native");
    expect(getResumePreviewKind({ contentType: "text/plain" })).toBe("native");
  });

  it("returns docx-html for docx by content type", () => {
    expect(getResumePreviewKind({ contentType: DOCX_MIME })).toBe("docx-html");
    expect(getResumePreviewKind({ contentType: `${DOCX_MIME}; charset=binary` })).toBe(
      "docx-html",
    );
  });

  it("returns docx-html for .docx extension when content type is unknown", () => {
    expect(
      getResumePreviewKind({ contentType: null, pathname: "/files/resume.docx" }),
    ).toBe("docx-html");
  });

  it("returns none for legacy .doc and unknown formats", () => {
    expect(getResumePreviewKind({ contentType: "application/msword" })).toBe("none");
    expect(getResumePreviewKind({ contentType: "", pathname: "/files/resume" })).toBe("none");
    expect(getResumePreviewKind({})).toBe("none");
  });
});
