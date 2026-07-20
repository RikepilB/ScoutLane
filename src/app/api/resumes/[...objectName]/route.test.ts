// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock, mockAuth, readResumeObject } = vi.hoisted(() => {
  const fn = () => vi.fn();
  return {
    prismaMock: {
      user: { findUnique: fn() },
      applicant: { findFirst: fn() },
      applicantAttachment: { findFirst: fn() },
    },
    mockAuth: fn(),
    readResumeObject: fn(),
  };
});

vi.mock("@/lib/db/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/lib/auth/auth", () => ({ auth: mockAuth }));
vi.mock("@/lib/resume/storage-read", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/resume/storage-read")>();
  return { ...actual, readResumeObject };
});

import { GET } from "@/app/api/resumes/[...objectName]/route";

function call(objectName: string[]) {
  return GET(new Request(`http://localhost/api/resumes/${objectName.join("/")}`) as never, {
    params: Promise.resolve({ objectName }),
  });
}

beforeEach(() => {
  mockAuth.mockResolvedValue({ user: { email: "admin@scoutlane.local" } });
  prismaMock.user.findUnique.mockResolvedValue({ organizationId: "org-1" });
  prismaMock.applicant.findFirst.mockResolvedValue({ id: "a1" });
  prismaMock.applicantAttachment.findFirst.mockResolvedValue(null);
  readResumeObject.mockResolvedValue({
    buffer: Buffer.from("%PDF-1.4 fake"),
    contentType: "application/pdf",
    filename: "ada.pdf",
    size: 13,
  });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/resumes/[...objectName] authorization", () => {
  it("returns 401 and never reads the file when unauthenticated", async () => {
    mockAuth.mockResolvedValueOnce(null);

    const response = await call(["resumes", "2026-06", "ada-uuid.pdf"]);

    expect(response.status).toBe(401);
    expect(readResumeObject).not.toHaveBeenCalled();
  });

  it("returns 404 when the resume belongs to another organization", async () => {
    prismaMock.applicant.findFirst.mockResolvedValueOnce(null);
    prismaMock.applicantAttachment.findFirst.mockResolvedValueOnce(null);

    const response = await call(["resumes", "2026-06", "ada-uuid.pdf"]);

    expect(response.status).toBe(404);
    expect(readResumeObject).not.toHaveBeenCalled();
  });

  it("serves the file when the caller's organization owns it", async () => {
    const response = await call(["resumes", "2026-06", "ada-uuid.pdf"]);

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/pdf");
    expect(readResumeObject).toHaveBeenCalledWith("resumes/2026-06/ada-uuid.pdf");
  });
});
