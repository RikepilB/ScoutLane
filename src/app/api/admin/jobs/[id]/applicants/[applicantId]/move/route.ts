import { z } from "zod";
import { getCurrentUserWithOrganization } from "@/server/services/current-user";
import { moveApplicantImpl } from "@/server/services/pipeline/update-impl";

interface RouteProps {
  params: Promise<{ id: string; applicantId: string }>;
}

const bodySchema = z.object({ targetStageId: z.string().min(1, "targetStageId is required") });

/**
 * REST parity for the Kanban drag-and-drop move. Thin handler: authenticate,
 * validate, delegate to the shared `moveApplicantImpl` service (which enforces
 * org scoping, logs the transition, and dispatches webhooks/integrations).
 */
export async function POST(request: Request, { params }: RouteProps) {
  const { applicantId } = await params;

  const user = await getCurrentUserWithOrganization();
  if (!user) {
    return Response.json({ success: false, error: "Not authenticated" }, { status: 401 });
  }
  if (!user.organizationId) {
    return Response.json({ success: false, error: "Not authorized" }, { status: 403 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json(
      { success: false, error: parsed.error.issues[0]?.message ?? "Invalid body" },
      { status: 400 },
    );
  }

  const result = await moveApplicantImpl(applicantId, parsed.data.targetStageId);
  if (!result.success) {
    const status = result.error === "Applicant not found" ? 404 : 400;
    return Response.json(result, { status });
  }

  return Response.json(result, { status: 200 });
}
