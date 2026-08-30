// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  prisma: {
    applicant: { findUnique: vi.fn(), update: vi.fn() },
    pipelineStage: { findUnique: vi.fn() },
    stageTransition: { create: vi.fn() },
    webhook: { findMany: vi.fn() },
    jobIntegration: { findUnique: vi.fn(), update: vi.fn() },
    integrationLog: { findFirst: vi.fn(), create: vi.fn() },
  },
  requireSession: vi.fn(),
  revalidatePath: vi.fn(),
  dispatchWebhook: vi.fn(),
  validateEgressUrl: vi.fn(),
  decryptSecret: vi.fn(),
  redactIntegrationResponse: vi.fn(),
}));

vi.mock("@/lib/db/prisma", () => ({ prisma: mocks.prisma }));
vi.mock("@/server/services/_lib/validate-session", () => ({
  requireSession: mocks.requireSession,
}));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("@/lib/webhook", () => ({ dispatchWebhook: mocks.dispatchWebhook }));
vi.mock("@/lib/webhook/validate-egress-url", () => ({
  validateEgressUrl: mocks.validateEgressUrl,
}));
vi.mock("@/lib/security/integration-secrets", () => ({
  decryptSecret: mocks.decryptSecret,
}));
vi.mock("@/lib/security/integration-response-redaction", () => ({
  redactIntegrationResponse: mocks.redactIntegrationResponse,
}));

import { moveApplicantFromWorker, moveApplicantImpl } from "./update-impl";

const SESSION_USER = { id: "user-1", email: "admin@example.com", role: "ADMIN", organizationId: "org-1" };

function seedExisting(overrides: Partial<Record<string, unknown>> = {}) {
  mocks.prisma.applicant.findUnique.mockResolvedValue({
    pipelineStageId: "stage-from",
    status: "NEW",
    jobId: "job-1",
    job: { organizationId: "org-1", title: "Engineer", assessmentTitle: null, assessmentQuestions: null },
    ...overrides,
  });
}

function seedNewStage(overrides: Partial<Record<string, unknown>> = {}) {
  mocks.prisma.pipelineStage.findUnique.mockResolvedValue({
    id: "stage-to",
    name: "Interview",
    jobId: "job-1",
    status: "INTERVIEW",
    ...overrides,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireSession.mockResolvedValue(SESSION_USER);
  mocks.prisma.webhook.findMany.mockResolvedValue([]);
  mocks.prisma.jobIntegration.findUnique.mockResolvedValue(null);
  mocks.prisma.applicant.update.mockResolvedValue({
    id: "applicant-1",
    name: "Jane Doe",
    email: "jane@example.com",
    job: { title: "Engineer" },
  });
  mocks.prisma.stageTransition.create.mockResolvedValue({ id: "transition-1" });
  vi.stubGlobal("fetch", vi.fn());
});

describe("moveApplicantImpl — characterization (pre-refactor baseline)", () => {
  it("returns NOT_FOUND when the applicant does not exist", async () => {
    mocks.prisma.applicant.findUnique.mockResolvedValue(null);

    await expect(moveApplicantImpl("applicant-1", "stage-to")).resolves.toEqual({
      success: false,
      code: "NOT_FOUND",
      error: "Applicant not found",
    });
  });

  it("returns NOT_FOUND when the applicant's job belongs to another organization", async () => {
    seedExisting({ job: { organizationId: "org-2", title: "Engineer", assessmentTitle: null, assessmentQuestions: null } });
    seedNewStage();

    await expect(moveApplicantImpl("applicant-1", "stage-to")).resolves.toEqual({
      success: false,
      code: "NOT_FOUND",
      error: "Applicant not found",
    });
    expect(mocks.prisma.applicant.update).not.toHaveBeenCalled();
  });

  it("returns NOT_FOUND when expectedJobId does not match the applicant's job", async () => {
    seedExisting({ jobId: "job-1" });

    await expect(moveApplicantImpl("applicant-1", "stage-to", "job-OTHER")).resolves.toEqual({
      success: false,
      code: "NOT_FOUND",
      error: "Applicant not found",
    });
    expect(mocks.prisma.applicant.update).not.toHaveBeenCalled();
  });

  it("returns INVALID_STAGE when the target stage doesn't belong to the applicant's job", async () => {
    seedExisting();
    seedNewStage({ jobId: "job-OTHER" });

    await expect(moveApplicantImpl("applicant-1", "stage-to")).resolves.toEqual({
      success: false,
      code: "INVALID_STAGE",
      error: "Invalid stage",
    });
    expect(mocks.prisma.applicant.update).not.toHaveBeenCalled();
  });

  it("short-circuits with unchanged:true and performs no writes when already on the target stage", async () => {
    seedExisting({ pipelineStageId: "stage-to" });
    seedNewStage({ id: "stage-to" });

    await expect(moveApplicantImpl("applicant-1", "stage-to")).resolves.toEqual({
      success: true,
      unchanged: true,
    });

    expect(mocks.prisma.applicant.update).not.toHaveBeenCalled();
    expect(mocks.prisma.stageTransition.create).not.toHaveBeenCalled();
    expect(mocks.prisma.webhook.findMany).not.toHaveBeenCalled();
    expect(mocks.prisma.jobIntegration.findUnique).not.toHaveBeenCalled();
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("falls back fromStage to the applicant's current status when pipelineStageId is null, and sets status from the new stage", async () => {
    seedExisting({ pipelineStageId: null, status: "NEW" });
    seedNewStage({ status: "INTERVIEW" });

    const result = await moveApplicantImpl("applicant-1", "stage-to");

    expect(result).toEqual({ success: true });
    expect(mocks.prisma.pipelineStage.findUnique).toHaveBeenCalledTimes(1); // only the new-stage lookup, not a from-stage lookup
    expect(mocks.prisma.applicant.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "INTERVIEW" }) }),
    );
    expect(mocks.prisma.stageTransition.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ fromStage: "NEW", toStage: "Interview" }) }),
    );
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin/jobs/job-1/pipeline");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin/jobs/job-1/applicants");
  });

  it("does not fail the move when webhook dispatch rejects", async () => {
    seedExisting();
    seedNewStage();
    mocks.prisma.webhook.findMany.mockResolvedValue([{ id: "webhook-1", active: true, events: ["applicant.status_changed"] }]);
    mocks.dispatchWebhook.mockReturnValue(Promise.reject(new Error("network down")));

    await expect(moveApplicantImpl("applicant-1", "stage-to")).resolves.toEqual({ success: true });
  });

  it("skips integration dispatch when a prior success already exists for this transition (idempotency guard)", async () => {
    seedExisting();
    seedNewStage();
    mocks.prisma.jobIntegration.findUnique.mockResolvedValue({
      id: "integration-1",
      jobId: "job-1",
      active: true,
      endpointUrl: "https://example.com/hook",
      apiKey: "encrypted",
      includeQuestions: false,
      stage: { name: "Interview" },
    });
    mocks.prisma.integrationLog.findFirst.mockResolvedValue({ id: "log-existing" });

    await expect(moveApplicantImpl("applicant-1", "stage-to")).resolves.toEqual({ success: true });

    expect(fetch).not.toHaveBeenCalled();
    expect(mocks.prisma.integrationLog.create).not.toHaveBeenCalled();
    expect(mocks.prisma.jobIntegration.update).not.toHaveBeenCalled();
  });

  it("logs status:0 and increments failureCount when the integration fetch throws", async () => {
    seedExisting();
    seedNewStage();
    mocks.prisma.jobIntegration.findUnique.mockResolvedValue({
      id: "integration-1",
      jobId: "job-1",
      active: true,
      endpointUrl: "https://example.com/hook",
      apiKey: "encrypted",
      includeQuestions: false,
      stage: { name: "Interview" },
    });
    mocks.prisma.integrationLog.findFirst.mockResolvedValue(null);
    mocks.decryptSecret.mockReturnValue("plain-key");
    mocks.validateEgressUrl.mockResolvedValue("https://example.com/hook");
    (fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("ECONNREFUSED"));

    await expect(moveApplicantImpl("applicant-1", "stage-to")).resolves.toEqual({ success: true });

    expect(mocks.prisma.integrationLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 0, responseBody: "Network error" }),
      }),
    );
    expect(mocks.prisma.jobIntegration.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ failureCount: { increment: 1 } }),
      }),
    );
  });
});

describe("moveApplicantFromWorker", () => {
  it("returns NOT_FOUND when the applicant or its job can't be resolved", async () => {
    mocks.prisma.applicant.findUnique.mockResolvedValue(null);

    await expect(moveApplicantFromWorker("applicant-1", "stage-to")).resolves.toEqual({
      success: false,
      code: "NOT_FOUND",
      error: "Applicant not found",
    });
    expect(mocks.requireSession).not.toHaveBeenCalled();
  });

  it("moves with no session, records changedById: null, dispatches an active integration, and skips revalidatePath", async () => {
    mocks.prisma.applicant.findUnique
      .mockResolvedValueOnce({ job: { organizationId: "org-1" } }) // worker's own org lookup
      .mockResolvedValueOnce({
        pipelineStageId: "stage-from",
        status: "NEW",
        jobId: "job-1",
        job: { organizationId: "org-1", title: "Engineer", assessmentTitle: null, assessmentQuestions: null },
      }); // moveApplicantCore's lookup
    seedNewStage();
    mocks.prisma.jobIntegration.findUnique.mockResolvedValue({
      id: "integration-1",
      jobId: "job-1",
      active: true,
      endpointUrl: "https://example.com/hook",
      apiKey: "encrypted",
      includeQuestions: false,
      stage: { name: "Interview" },
    });
    mocks.prisma.integrationLog.findFirst.mockResolvedValue(null);
    mocks.decryptSecret.mockReturnValue("plain-key");
    mocks.validateEgressUrl.mockResolvedValue("https://example.com/hook");
    mocks.redactIntegrationResponse.mockImplementation((v: unknown) => v);
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => "ok",
    });

    const result = await moveApplicantFromWorker("applicant-1", "stage-to");

    expect(result).toEqual({ success: true });
    expect(mocks.requireSession).not.toHaveBeenCalled();
    expect(mocks.prisma.stageTransition.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ changedById: null }) }),
    );
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });
});
