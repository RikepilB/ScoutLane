// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const { readFileMock, findUniqueMock } = vi.hoisted(() => ({
  readFileMock: vi.fn(),
  findUniqueMock: vi.fn(),
}));

vi.mock("node:fs/promises", () => ({
  readFile: readFileMock,
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: { resumeFile: { findUnique: findUniqueMock } },
}));

import {
  buildContentDisposition,
  readResumeObject,
  resolveLocalResumePath,
} from "./storage-read";

beforeEach(() => {
  readFileMock.mockReset();
  findUniqueMock.mockReset();
});

describe("readResumeObject", () => {
  it("returns the local file when it exists on disk", async () => {
    readFileMock.mockResolvedValue(Buffer.from("local pdf bytes"));

    const result = await readResumeObject("resumes/2026-06/jane-abc.pdf");

    expect(result).not.toBeNull();
    expect(result!.buffer.toString()).toBe("local pdf bytes");
    expect(result!.contentType).toBe("application/pdf");
    expect(result!.filename).toBe("jane-abc.pdf");
    expect(findUniqueMock).not.toHaveBeenCalled();
  });

  it("falls back to the database when the local file is missing", async () => {
    readFileMock.mockRejectedValue(new Error("ENOENT"));
    findUniqueMock.mockResolvedValue({
      contentType: "application/pdf",
      data: Uint8Array.from(Buffer.from("db pdf bytes")),
      filename: "jane-original.pdf",
      size: 12,
    });

    const result = await readResumeObject("resumes/2026-06/jane-abc.pdf");

    expect(result).not.toBeNull();
    expect(result!.buffer.toString()).toBe("db pdf bytes");
    expect(result!.filename).toBe("jane-original.pdf");
    expect(findUniqueMock).toHaveBeenCalledWith({
      where: { objectName: "resumes/2026-06/jane-abc.pdf" },
      select: { contentType: true, data: true, filename: true, size: true },
    });
  });

  it("returns null when the object exists nowhere", async () => {
    readFileMock.mockRejectedValue(new Error("ENOENT"));
    findUniqueMock.mockResolvedValue(null);

    await expect(readResumeObject("resumes/2026-06/missing.pdf")).resolves.toBeNull();
  });

  it("rejects path traversal", async () => {
    await expect(readResumeObject("../../etc/passwd")).rejects.toThrow("Invalid resume path.");
    expect(readFileMock).not.toHaveBeenCalled();
  });
});

describe("resolveLocalResumePath", () => {
  it("returns null for traversal and the bare root", () => {
    expect(resolveLocalResumePath("..")).toBeNull();
    expect(resolveLocalResumePath("")).toBeNull();
  });
});

describe("buildContentDisposition", () => {
  it("emits inline with quoted and RFC 5987 filenames", () => {
    expect(buildContentDisposition("inline", "resume.pdf")).toBe(
      `inline; filename="resume.pdf"; filename*=UTF-8''resume.pdf`,
    );
  });

  it("sanitizes non-ascii filenames in the quoted fallback", () => {
    const value = buildContentDisposition("attachment", "résumé.pdf");
    expect(value.startsWith(`attachment; filename="r_sum_.pdf"`)).toBe(true);
    expect(value).toContain("filename*=UTF-8''r%C3%A9sum%C3%A9.pdf");
  });
});
