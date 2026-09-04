import { describe, it, expect, vi, beforeEach } from "vitest";

const { authMock, jobCreate, userFindUnique, orgCreate, templateFindFirst } =
  vi.hoisted(() => ({
    authMock: vi.fn(),
    jobCreate: vi.fn(),
    userFindUnique: vi.fn(),
    orgCreate: vi.fn(),
    templateFindFirst: vi.fn(),
  }));

vi.mock("@/lib/auth/auth", () => ({ auth: authMock }));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    user: { findUnique: userFindUnique },
    organization: { create: orgCreate },
    jobTemplate: { findFirst: templateFindFirst },
    job: { create: jobCreate },
  },
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { createJobImpl } from "./create-impl";

beforeEach(() => {
  authMock.mockReset();
  jobCreate.mockReset();
  userFindUnique.mockReset();
  orgCreate.mockReset();
  templateFindFirst.mockReset();
  authMock.mockResolvedValue({ user: { email: "admin@scoutlane.dev" } });
  userFindUnique.mockResolvedValue({
    id: "user-1",
    organizationId: "org-1",
    organization: { id: "org-1" },
  });
  jobCreate.mockResolvedValue({ id: "job-1", slug: "custom-slug" });
});

describe("createJobImpl FormData extraction", () => {
  it("persists slug, department, whatYouWillDo, requirements, toolsAndSkills from form data", async () => {
    const fd = new FormData();
    fd.set("title", "AI Engineer");
    fd.set("description", "Productionize AI/ML systems for security.");
    fd.set("status", "draft");
    fd.set("slug", "custom-slug");
    fd.set("department", "Cybersecurity");
    fd.set("whatYouWillDo", "Build RAG pipelines on confidential data.");
    fd.set("requirements", "5+ yrs Python\nLLM ops experience");
    fd.set("toolsAndSkills", "Python\nLangChain\nGCP");

    const result = await createJobImpl(fd);

    expect(result.success).toBe(true);
    expect(jobCreate).toHaveBeenCalledTimes(1);
    const data = jobCreate.mock.calls[0][0].data;
    expect(data.slug).toBe("custom-slug");
    expect(data.department).toBe("Cybersecurity");
    expect(data.whatYouWillDo).toBe("Build RAG pipelines on confidential data.");
    expect(data.requirements).toEqual(["5+ yrs Python", "LLM ops experience"]);
    expect(data.toolsAndSkills).toEqual(["Python", "LangChain", "GCP"]);
  });

  it("derives slug from title when slug is omitted", async () => {
    const fd = new FormData();
    fd.set("title", "Senior Platform Engineer");
    fd.set("description", "Own the deployment platform end to end.");
    fd.set("status", "draft");

    await createJobImpl(fd);

    const data = jobCreate.mock.calls[0][0].data;
    expect(data.slug).toMatch(/^senior-platform-engineer-[0-9a-f]{8}$/);
  });
});
