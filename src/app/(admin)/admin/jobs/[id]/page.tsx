import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, MapPin, Briefcase, DollarSign } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { getJobStatus } from "@/lib/jobs";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { JobStatusActions } from "@/components/admin/JobStatusActions";
import { DeleteJobButton } from "@/components/admin/DeleteJobButton";
import { getCurrentUserWithOrganization } from "@/server/services/current-user";
import {
  ApplicantTrendChart,
  ConversionFunnelChart,
  PipelineStageDistributionChart,
  TopLabelsBarChart,
} from "@/components/dashboard/Charts";
import { computeConversionFunnel } from "@/lib/analytics/conversionFunnel";
interface OverviewPageProps {
  params: Promise<{ id: string }>;
}

export default async function JobOverviewPage({ params }: OverviewPageProps) {
  const { id } = await params;
  const user = await getCurrentUserWithOrganization();
  const organizationId = user?.organizationId;
  if (!organizationId) notFound();

  const job = await prisma.job.findFirst({
    where: { id, organizationId },
    include: {
      _count: { select: { applicants: true } },
      stages: { orderBy: { order: "asc" } },
    },
  });

  if (!job) notFound();

  const status = getJobStatus(job);

  const stageCountRows = await prisma.applicant.groupBy({
    by: ["pipelineStageId"],
    where: { jobId: id },
    _count: { id: true },
  });
  const countByStageId = Object.fromEntries(
    stageCountRows.map((row: (typeof stageCountRows)[number]) => [
      row.pipelineStageId ?? "unassigned",
      row._count.id,
    ]),
  );
  const firstStageId = job.stages[0]?.id ?? null;
  const unassignedCount = countByStageId.unassigned ?? 0;

  const stageCounts = job.stages.map((stage: (typeof job.stages)[number]) => ({
    ...stage,
    count:
      (countByStageId[stage.id] ?? 0) +
      (firstStageId && stage.id === firstStageId ? unassignedCount : 0),
  }));

  const now = Date.now();
  const weekAgo = new Date(now - 7 * 86400000);
  const monthAgo = new Date(now - 30 * 86400000);
  const [newThisWeek, newThisMonth] = await Promise.all([
    prisma.applicant.count({ where: { jobId: id, createdAt: { gte: weekAgo } } }),
    prisma.applicant.count({ where: { jobId: id, createdAt: { gte: monthAgo } } }),
  ]);

  const applicantsForCharts: Array<{
    id: string;
    createdAt: Date;
    data: unknown;
    pipelineStageId: string | null;
  }> = await prisma.applicant.findMany({
    where: { jobId: id },
    select: { id: true, createdAt: true, data: true, pipelineStageId: true },
  });

  const stageTransitions = await prisma.stageTransition.findMany({
    where: { jobId: id },
    select: { applicantId: true, toStage: true },
  });

  const conversionFunnel = computeConversionFunnel(
    job.stages.map((s: (typeof job.stages)[number]) => ({ id: s.id, name: s.name, order: s.order })),
    applicantsForCharts.map((a) => ({ id: a.id, pipelineStageId: a.pipelineStageId })),
    stageTransitions,
  );

  const dailyMap = new Map<string, number>();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now - i * 86400000);
    dailyMap.set(d.toLocaleDateString("en-US", { month: "short", day: "numeric" }), 0);
  }
  for (const a of applicantsForCharts) {
    const key = a.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    if (dailyMap.has(key)) dailyMap.set(key, (dailyMap.get(key) ?? 0) + 1);
  }
  const applicantTrend = Array.from(dailyMap.entries()).map(([date, count]) => ({ date, count }));

  const instCounts = new Map<string, number>();
  const degreeCounts = new Map<string, number>();
  for (const a of applicantsForCharts) {
    const edu = (a.data as { education?: Array<{ institution?: string; field?: string; degree?: string }> } | null)
      ?.education;
    const first = edu?.[0];
    if (first?.institution) {
      instCounts.set(first.institution, (instCounts.get(first.institution) ?? 0) + 1);
    }
    const deg = first?.field ?? first?.degree;
    if (deg) {
      degreeCounts.set(deg, (degreeCounts.get(deg) ?? 0) + 1);
    }
  }
  const topInstitutions = Array.from(instCounts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
  const topDegrees = Array.from(degreeCounts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const pipelineChartData = stageCounts.map((s: (typeof stageCounts)[number]) => ({
    name: s.name,
    count: s.count,
  }));

  return (    <div className="space-y-8">
      <section className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-4 flex-1">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-semibold tracking-tight">{job.title}</h2>
                <StatusBadge status={status} />
              </div>
              <p className="mt-1 text-sm text-muted-foreground">/{job.slug}</p>
            </div>

            <div className="flex flex-wrap gap-4 text-sm">
              {job.location && (
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {job.location}
                </span>
              )}
              {job.type && (
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Briefcase className="h-4 w-4" />
                  {job.type}
                </span>
              )}
              {job.salary && (
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <DollarSign className="h-4 w-4" />
                  {job.salary}
                </span>
              )}
            </div>

            {job.description && (
              <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                {job.description}
              </p>
            )}
          </div>

          <div className="flex shrink-0 gap-2">
            <JobStatusActions jobId={id} status={status} />
            {user?.role === "ADMIN" && <DeleteJobButton jobId={id} />}
            <Button variant="outline" asChild>
              <Link href={`/careers/${job.slug}`} target="_blank" className="inline-flex items-center gap-1">
                <ExternalLink className="h-4 w-4" />
                Public page
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stageCounts.map((stage: (typeof stageCounts)[number]) => (
          <div
            key={stage.id}
            className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm"
          >
            <div className="flex items-center gap-2">
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: stage.color ?? "#6366f1" }}
              />
              <span className="text-sm text-muted-foreground">{stage.name}</span>
            </div>
            <div className="mt-2 text-2xl font-semibold tracking-tight">{stage.count}</div>
          </div>
        ))}
      </div>

      <section className="space-y-4">
        <div>
          <h3 className="text-base font-semibold tracking-tight text-slate-900">Analytics (this job)</h3>
          <p className="mt-1 text-sm text-muted-foreground">All metrics below are scoped to this role.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
            <p className="text-xs text-muted-foreground">Total applicants</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight">{job._count.applicants}</p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
            <p className="text-xs text-muted-foreground">New this week</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight">{newThisWeek}</p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
            <p className="text-xs text-muted-foreground">New this month</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight">{newThisMonth}</p>
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <ApplicantTrendChart
            data={applicantTrend}
            title="Application volume"
            subtitle="Daily applications in the last 14 days (this job)"
          />
          <PipelineStageDistributionChart data={pipelineChartData} />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <ConversionFunnelChart data={conversionFunnel} />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <TopLabelsBarChart
            title="Top institutions"
            subtitle="Based on first education entry in parsed data"
            data={topInstitutions}
            labelKey="label"
          />
          <TopLabelsBarChart
            title="Top fields of study"
            subtitle="Degree / field from first education entry"
            data={topDegrees}
            labelKey="label"
          />
        </div>
      </section>

      <section className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm">        <h3 className="text-base font-semibold tracking-tight">Quick actions</h3>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button variant="outline" asChild>
            <Link href={`/admin/jobs/${id}/pipeline`}>View pipeline</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/admin/jobs/${id}/applicants`}>View applicants</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/admin/jobs/${id}/stages`}>Manage stages</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
