import { describe, expect, it, vi, beforeEach } from "vitest";

const { getCurrentUser, saveCustomFields, jobFindFirst } = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  saveCustomFields: vi.fn(),
  jobFindFirst: vi.fn(),
}));

vi.mock("@/server/services/current-user", () => ({
  getCurrentUserWithOrganization: getCurrentUser,
}));
vi.mock("@/server/services/jobs/update-impl", () => ({
  saveCustomFieldsImpl: saveCustomFields,
}));
vi.mock("@/lib/db/prisma", () => ({
  prisma: { job: { findFirst: jobFindFirst } },
}));

import { POST } from "./route";

function req(body: unknown) {
  return new Request("http://x/form", {
    method: "POST",
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

const ctx = { params: Promise.resolve({ id: "job1" }) };
const validFields = [{ id: "city", label: "City", type: "text", required: false }];

beforeEach(() => {
  getCurrentUser.mockReset();
  saveCustomFields.mockReset();
});

describe("POST /api/admin/jobs/[id]/form", () => {
  it("returns 401 when unauthenticated", async () => {
    getCurrentUser.mockResolvedValue(null);
    const res = await POST(req({ customFields: validFields }), ctx);
    expect(res.status).toBe(401);
  });

  it("returns 403 when the user has no organization", async () => {
    getCurrentUser.mockResolvedValue({ id: "u1", organizationId: null });
    const res = await POST(req({ customFields: validFields }), ctx);
    expect(res.status).toBe(403);
  });

  it("returns 400 when a field has an invalid type", async () => {
    getCurrentUser.mockResolvedValue({ id: "u1", organizationId: "org1" });
    const res = await POST(
      req({ customFields: [{ id: "x", label: "X", type: "file", required: false }] }),
      ctx,
    );
    expect(res.status).toBe(400);
    expect(saveCustomFields).not.toHaveBeenCalled();
  });

  it("accepts a bare array body", async () => {
    getCurrentUser.mockResolvedValue({ id: "u1", organizationId: "org1" });
    saveCustomFields.mockResolvedValue({ success: true });
    const res = await POST(req(validFields), ctx);
    expect(saveCustomFields).toHaveBeenCalledWith("job1", validFields);
    expect(res.status).toBe(200);
  });

  it("delegates valid {customFields} body to saveCustomFieldsImpl", async () => {
    getCurrentUser.mockResolvedValue({ id: "u1", organizationId: "org1" });
    saveCustomFields.mockResolvedValue({ success: true });
    const res = await POST(req({ customFields: validFields }), ctx);
    expect(saveCustomFields).toHaveBeenCalledWith("job1", validFields);
    expect(res.status).toBe(200);
  });

  it("returns 404 when the job is not found / not in org", async () => {
    getCurrentUser.mockResolvedValue({ id: "u1", organizationId: "org1" });
    saveCustomFields.mockResolvedValue({ success: false, error: "Job not found" });
    const res = await POST(req({ customFields: validFields }), ctx);
    expect(res.status).toBe(404);
  });
});
