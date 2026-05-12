import { prisma } from "@/lib/db/prisma";

interface RouteProps {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteProps) {
  const { id } = await params;

  const job = await prisma.job.findUnique({
    where: { id },
    select: { customFields: true },
  });

  if (!job) {
    return Response.json({ error: "Job not found" }, { status: 404 });
  }

  return Response.json({ customFields: job.customFields ?? [] });
}
