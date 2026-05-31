import { describe, expect, it, vi, beforeEach } from "vitest";

const { getCurrentUser, moveApplicant } = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  moveApplicant: vi.fn(),
}));

vi.mock("@/server/services/current-user", () => ({
  getCurrentUserWithOrganization: getCurrentUser,
}));
vi.mock("@/server/services/pipeline/update-impl", () => ({
  moveApplicantImpl: moveApplicant,
}));

import { POST } from "./route";

function req(body: unknown) {
  return new Request("http://x/move", {
    method: "POST",
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

const ctx = { params: Promise.resolve({ id: "job1", applicantId: "a1" }) };

beforeEach(() => {
  getCurrentUser.mockReset();
  moveApplicant.mockReset();
});

describe("POST /api/admin/jobs/[id]/applicants/[applicantId]/move", () => {
  it("returns 401 when unauthenticated", async () => {
    getCurrentUser.mockResolvedValue(null);
    const res = await POST(req({ targetStageId: "s2" }), ctx);
    expect(res.status).toBe(401);
    expect(moveApplicant).not.toHaveBeenCalled();
  });

  it("returns 403 when the user has no organization", async () => {
    getCurrentUser.mockResolvedValue({ id: "u1", organizationId: null });
    const res = await POST(req({ targetStageId: "s2" }), ctx);
    expect(res.status).toBe(403);
  });

  it("returns 400 on invalid body", async () => {
    getCurrentUser.mockResolvedValue({ id: "u1", organizationId: "org1" });
    const res = await POST(req({}), ctx);
    expect(res.status).toBe(400);
    expect(moveApplicant).not.toHaveBeenCalled();
  });

  it("delegates to moveApplicantImpl (with route jobId) and returns 200 on success", async () => {
    getCurrentUser.mockResolvedValue({ id: "u1", organizationId: "org1" });
    moveApplicant.mockResolvedValue({ success: true });
    const res = await POST(req({ targetStageId: "s2" }), ctx);
    expect(moveApplicant).toHaveBeenCalledWith("a1", "s2", "job1");
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ success: true });
  });

  it("maps code NOT_FOUND to 404", async () => {
    getCurrentUser.mockResolvedValue({ id: "u1", organizationId: "org1" });
    moveApplicant.mockResolvedValue({ success: false, code: "NOT_FOUND", error: "Applicant not found" });
    const res = await POST(req({ targetStageId: "s2" }), ctx);
    expect(res.status).toBe(404);
  });

  it("maps other service errors (e.g. INVALID_STAGE) to 400", async () => {
    getCurrentUser.mockResolvedValue({ id: "u1", organizationId: "org1" });
    moveApplicant.mockResolvedValue({ success: false, code: "INVALID_STAGE", error: "Invalid stage" });
    const res = await POST(req({ targetStageId: "bad" }), ctx);
    expect(res.status).toBe(400);
  });
});
