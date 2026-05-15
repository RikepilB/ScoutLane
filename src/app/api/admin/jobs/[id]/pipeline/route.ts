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
    orderBy: { lastStageChangeAt: "desc" },
      select: {
      id: true,
      name: true,
      email: true,
      score: true,
      status: true,
      pipelineStageId: true,
      lastStageChangeAt: true,
      createdAt: true,
      interviewDate: true,
      data: true,
    },
  });

  const firstStageId = stages[0]?.id ?? null;

  const grouped = stages.map((stage: (typeof stages)[number]) => ({
    id: stage.id,
    name: stage.name,
    color: stage.color,
    order: stage.order,
    applicants: applicants
      .filter((a: (typeof applicants)[number]) =>
        a.pipelineStageId ? a.pipelineStageId === stage.id : stage.id === firstStageId,
      )
      .map((a: (typeof applicants)[number]) => {
        const d = (a.data ?? {}) as {
          education?: Array<{ institution?: string; field?: string }>;
        };
        const firstEdu = d.education?.[0];
        return {
          id: a.id,
          name: a.name,
          email: a.email,
          score: a.score,
          status: a.status,
          createdAt: a.createdAt.toISOString(),
          lastStageChangeAt: a.lastStageChangeAt.toISOString(),
          interviewDate: a.interviewDate?.toISOString() ?? null,
          institution: firstEdu?.institution ?? null,
          program: firstEdu?.field ?? null,
        };
      }),
  }));

  return Response.json(grouped);
}
