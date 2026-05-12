import type { ApplicationStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db/prisma";

interface RouteProps {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteProps) {
  const { id } = await params;

  const stages = await prisma.pipelineStage.findMany({
    where: { jobId: id },
    orderBy: { order: "asc" },
  });

  const applicants = await prisma.applicant.findMany({
    where: { jobId: id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      score: true,
      status: true,
      createdAt: true,
    },
  });

  const grouped = stages.map((stage) => {
    const status = stage.name.toUpperCase() as ApplicationStatus;
    return {
      id: stage.id,
      name: stage.name,
      color: stage.color,
      order: stage.order,
      applicants: applicants
        .filter((a) => a.status === status)
        .map((a) => ({ ...a, createdAt: a.createdAt.toISOString() })),
    };
  });

  return Response.json(grouped);
}
