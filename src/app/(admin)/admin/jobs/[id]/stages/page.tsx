import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUserWithOrganization } from "@/server/services/current-user";
import { StagesManager } from "./_components/StagesManager";

interface StagesPageProps {
  params: Promise<{ id: string }>;
}

export default async function StagesPage({ params }: StagesPageProps) {
  const { id } = await params;
  const user = await getCurrentUserWithOrganization();
  const organizationId = user?.organizationId;
  if (!organizationId) notFound();

  const job = await prisma.job.findFirst({ where: { id, organizationId } });
  if (!job) notFound();

  const stages = await prisma.pipelineStage.findMany({
    where: { jobId: id },
    orderBy: { order: "asc" },
  });

  return <StagesManager jobId={id} stages={stages} />;
}
