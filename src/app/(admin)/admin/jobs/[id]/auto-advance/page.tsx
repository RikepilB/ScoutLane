import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUserWithOrganization } from "@/server/services/current-user";
import { AutoAdvanceRuleForm } from "./_components/AutoAdvanceRuleForm";
import { AutoAdvanceRuleList } from "./_components/AutoAdvanceRuleList";

interface AutoAdvancePageProps {
  params: Promise<{ id: string }>;
}

export default async function AutoAdvancePage({ params }: AutoAdvancePageProps) {
  const { id } = await params;
  const user = await getCurrentUserWithOrganization();
  const organizationId = user?.organizationId;
  if (!organizationId || user.role === "GUEST") notFound();

  const job = await prisma.job.findFirst({
    where: { id, organizationId },
    include: {
      stages: { orderBy: { order: "asc" }, select: { id: true, name: true, order: true } },
      autoAdvanceRules: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          thresholdScore: true,
          active: true,
          sourceStage: { select: { name: true } },
          targetStage: { select: { name: true } },
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
            Score-threshold auto-advance
          </h3>
          <p className="text-sm text-muted-foreground">
            Automatically move an applicant to a later stage once their AI match score
            clears a threshold, while they sit in an earlier stage.
          </p>
        </div>
      </div>

      <AutoAdvanceRuleForm jobId={id} stages={job.stages} />

      <AutoAdvanceRuleList rules={job.autoAdvanceRules} />
    </div>
  );
}
