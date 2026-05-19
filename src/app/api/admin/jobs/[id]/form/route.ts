import { prisma } from "@/lib/db/prisma";
import { getCurrentUserWithOrganization } from "@/server/services/current-user";

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
