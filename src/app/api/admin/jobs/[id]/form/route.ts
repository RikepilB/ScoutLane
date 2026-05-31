import { prisma } from "@/lib/db/prisma";
import { getCurrentUserWithOrganization } from "@/server/services/current-user";
import { saveCustomFieldsImpl } from "@/server/services/jobs/update-impl";
import { customFieldsSchema } from "@/schemas/template";

interface RouteProps {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteProps) {
  const { id } = await params;
  const user = await getCurrentUserWithOrganization();
  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (!user.organizationId) {
    return Response.json({ error: "Not authorized" }, { status: 403 });
  }

  const job = await prisma.job.findFirst({
    where: { id, organizationId: user.organizationId },
    select: { customFields: true },
  });

  if (!job) {
    return Response.json({ error: "Job not found" }, { status: 404 });
  }

  return Response.json({ customFields: job.customFields ?? [] });
}

/**
 * REST parity for saving a job's application form fields. Thin handler:
 * authenticate, validate the body with the shared `customFieldsSchema`, then
 * delegate to `saveCustomFieldsImpl` (which enforces org scoping).
 */
export async function POST(request: Request, { params }: RouteProps) {
  const { id } = await params;
  const user = await getCurrentUserWithOrganization();
  if (!user) {
    return Response.json({ success: false, error: "Not authenticated" }, { status: 401 });
  }
  if (!user.organizationId) {
    return Response.json({ success: false, error: "Not authorized" }, { status: 403 });
  }

  const json = await request.json().catch(() => null);
  const parsed = customFieldsSchema.safeParse(
    json && typeof json === "object" && "customFields" in json
      ? (json as { customFields: unknown }).customFields
      : json,
  );
  if (!parsed.success) {
    return Response.json(
      { success: false, error: parsed.error.issues[0]?.message ?? "Invalid custom fields" },
      { status: 400 },
    );
  }

  const result = await saveCustomFieldsImpl(id, parsed.data);
  if (!result.success) {
    return Response.json(result, { status: 404 });
  }

  return Response.json(result, { status: 200 });
}
