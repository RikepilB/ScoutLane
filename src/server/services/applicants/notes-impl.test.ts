import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock, mockRequireSession, mockRevalidatePath } = vi.hoisted(() => {
  const fn = () => vi.fn();
  return {
    prismaMock: {
      applicant: { findUnique: fn() },
      applicantNote: { create: fn(), findUnique: fn(), update: fn(), delete: fn() },
    },
    mockRequireSession: fn(),
    mockRevalidatePath: fn(),
  };
});

vi.mock("@/lib/db/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/server/services/_lib/validate-session", () => ({
  requireSession: mockRequireSession,
}));
vi.mock("next/cache", () => ({ revalidatePath: mockRevalidatePath }));

import {
  createApplicantNoteImpl,
  deleteApplicantNoteImpl,
  updateApplicantNoteImpl,
} from "./notes-impl";

const user = { id: "u1", organizationId: "org-1", role: "ADMIN", email: "u@x.com" };

beforeEach(() => {
  mockRequireSession.mockReset();
  mockRevalidatePath.mockReset();
  prismaMock.applicant.findUnique.mockReset();
  prismaMock.applicantNote.create.mockReset();
  prismaMock.applicantNote.findUnique.mockReset();
  prismaMock.applicantNote.update.mockReset();
  prismaMock.applicantNote.delete.mockReset();
  mockRequireSession.mockResolvedValue(user);
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("createApplicantNoteImpl", () => {
  it("rejects an empty/whitespace-only note", async () => {
    await expect(createApplicantNoteImpl("app-1", "   ")).rejects.toThrow("Note cannot be empty");
    expect(prismaMock.applicant.findUnique).not.toHaveBeenCalled();
  });

  it("throws when the applicant is in another org", async () => {
    prismaMock.applicant.findUnique.mockResolvedValue({
      jobId: "job-1",
      job: { organizationId: "org-2" },
    });
    await expect(createApplicantNoteImpl("app-1", "hi")).rejects.toThrow("Applicant not found");
  });

  it("creates a note authored by the caller and revalidates", async () => {
    prismaMock.applicant.findUnique.mockResolvedValue({
      jobId: "job-1",
      job: { organizationId: "org-1" },
    });
    await createApplicantNoteImpl("app-1", "  Great candidate  ");
    expect(prismaMock.applicantNote.create).toHaveBeenCalledWith({
      data: { applicantId: "app-1", authorId: "u1", body: "Great candidate" },
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/jobs/job-1/applicants/app-1");
  });
});

describe("updateApplicantNoteImpl", () => {
  it("rejects an empty note", async () => {
    await expect(updateApplicantNoteImpl("note-1", "")).rejects.toThrow("Note cannot be empty");
  });

  it("throws when the note's applicant is in another org", async () => {
    prismaMock.applicantNote.findUnique.mockResolvedValue({
      applicantId: "app-1",
      applicant: { jobId: "job-1", job: { organizationId: "org-2" } },
    });
    await expect(updateApplicantNoteImpl("note-1", "edit")).rejects.toThrow("Note not found");
    expect(prismaMock.applicantNote.update).not.toHaveBeenCalled();
  });

  it("updates the note body and revalidates", async () => {
    prismaMock.applicantNote.findUnique.mockResolvedValue({
      applicantId: "app-1",
      applicant: { jobId: "job-1", job: { organizationId: "org-1" } },
    });
    await updateApplicantNoteImpl("note-1", "edited text");
    expect(prismaMock.applicantNote.update).toHaveBeenCalledWith({
      where: { id: "note-1" },
      data: { body: "edited text" },
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/jobs/job-1/applicants/app-1");
  });
});

describe("deleteApplicantNoteImpl", () => {
  it("throws when the note's applicant is in another org", async () => {
    prismaMock.applicantNote.findUnique.mockResolvedValue({
      applicantId: "app-1",
      applicant: { jobId: "job-1", job: { organizationId: "org-2" } },
    });
    await expect(deleteApplicantNoteImpl("note-1")).rejects.toThrow("Note not found");
    expect(prismaMock.applicantNote.delete).not.toHaveBeenCalled();
  });

  it("deletes the note and revalidates", async () => {
    prismaMock.applicantNote.findUnique.mockResolvedValue({
      applicantId: "app-1",
      applicant: { jobId: "job-1", job: { organizationId: "org-1" } },
    });
    await deleteApplicantNoteImpl("note-1");
    expect(prismaMock.applicantNote.delete).toHaveBeenCalledWith({ where: { id: "note-1" } });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/jobs/job-1/applicants/app-1");
  });
});
