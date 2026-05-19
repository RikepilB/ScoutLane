import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUserWithOrganization } from "@/server/services/current-user";
import { IntegrationForm } from "./_components/IntegrationForm";
import { IntegrationList } from "./_components/IntegrationList";

interface IntegrationsPageProps {
  params: Promise<{ id: string }>;
}

export default async function IntegrationsPage({ params }: IntegrationsPageProps) {
  const { id } = await params;
  const user = await getCurrentUserWithOrganization();
  const organizationId = user?.organizationId;
  if (!organizationId) notFound();

  const job = await prisma.job.findFirst({
    where: { id, organizationId },
    include: {
      stages: { orderBy: { order: "asc" } },
      integrations: {
        include: {
          stage: { select: { name: true } },
          logs: { orderBy: { createdAt: "desc" }, take: 10 },
        },
      },
    },
  });

  if (!job) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold tracking-tight text-slate-900">
            External integrations
          </h3>
          <p className="text-sm text-muted-foreground">
            Trigger API calls when applicants move through pipeline stages.
          </p>
        </div>
      </div>

      <IntegrationForm jobId={id} stages={job.stages} />

      <IntegrationList integrations={job.integrations} />
    </div>
  );
}
