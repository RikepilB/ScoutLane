import Link from "next/link";
import { ArrowUpRight, Briefcase, FileEdit, UserPlus, Users } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { getJobStatus } from "@/lib/jobs";
import { Button } from "@/components/ui/button";
import { DeferredDashboardCharts } from "@/components/dashboard/DeferredDashboardCharts";
import { requireSession } from "@/server/services/_lib/validate-session";
import { OnboardingTour } from "./_components/OnboardingTour";
import { buildHiringInsight } from "./dashboard-insight";
import { buildApplicantTrend, getUtcTrendStart } from "./dashboard-trend";

export const dynamic = "force-dynamic";

interface StatCardProps {
  label: string;
  value: number;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: "green" | "amber" | "cyan" | "peri";
}

const accentMap: Record<StatCardProps["accent"], { bg: string; fg: string }> = {
  green: { bg: "bg-success-soft", fg: "text-success" },
  amber: { bg: "bg-warning-soft", fg: "text-warning" },
  cyan: { bg: "bg-info-soft", fg: "text-info" },
  peri: { bg: "bg-info-soft", fg: "text-brand-slate" },
};

function StatCard({ label, value, hint, icon: Icon, accent }: StatCardProps) {
  const a = accentMap[accent];
  return (
    <article className="flex items-start gap-3.5 rounded-2xl border border-mist bg-surface p-[18px]">
      <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[10px] ${a.bg} ${a.fg}`}>
        <Icon className="h-[17px] w-[17px]" />
      </div>
      <div>
        <div className="text-[12.5px] text-steel">{label}</div>
        <div className="tabular mt-1 text-[30px] leading-none tracking-[-0.02em] text-ink-900" style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}>
          {value}
        </div>
        {hint ? <div className="mt-1.5 text-[11.5px] text-steel">{hint}</div> : null}
      </div>
    </article>
  );
}

export default async function AdminDashboardPage() {
  const { organizationId, role } = await requireSession({ allowGuest: true });

  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const trendStart = getUtcTrendStart(now);
  const [jobs, newApplicantsThisWeek, stageDistribution, dailyCounts] = await Promise.all([
    prisma.job.findMany({
      where: { organizationId },
      select: {
        archived: true,
        published: true,
        _count: { select: { applicants: true } },
      },
    }),
    prisma.applicant.count({
      where: { createdAt: { gte: oneWeekAgo }, job: { organizationId } },
    }),
    prisma.applicant.groupBy({
      by: ["status"],
      where: { job: { organizationId } },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
    }),
    prisma.$queryRaw<Array<{ dateKey: string; count: number }>>`
      SELECT
        TO_CHAR(a."createdAt", 'YYYY-MM-DD') AS "dateKey",
        COUNT(*)::int AS "count"
      FROM "Applicant" AS a
      INNER JOIN "Job" AS j ON j."id" = a."jobId"
      WHERE j."organizationId" = ${organizationId}
        AND a."createdAt" >= ${trendStart}
      GROUP BY 1
      ORDER BY 1 ASC
    `,
  ]);

  const activeJobs = jobs.filter((job) => getJobStatus(job) === "active");
  const draftJobs = jobs.filter((job) => getJobStatus(job) === "draft");
  const totalApplicants = jobs.reduce((sum, job) => sum + job._count.applicants, 0);

  const applicantTrend = buildApplicantTrend(now, dailyCounts);
  const chartStageDistribution = stageDistribution.map((stage) => ({
    status: stage.status,
    count: stage._count.id,
  }));
  const insight = buildHiringInsight({
    newApplicantsThisWeek,
    stageDistribution: chartStageDistribution,
  });

  return (
    <div className="min-w-0 flex-1 bg-paper">
      <OnboardingTour role={role} />
      <div className="flex w-full max-w-[1440px] flex-col gap-6 px-4 py-6 sm:px-8 sm:py-8">
        <section className="relative overflow-hidden rounded-card bg-ink-900 p-5 text-paper sm:p-8">
          <div aria-hidden="true" className="bg-wash-dark pointer-events-none absolute inset-0 opacity-75" />
          <div className="relative flex flex-wrap items-end justify-between gap-6">
            <div>
              <h1 className="mb-2.5 text-[40px] leading-none tracking-[-0.03em]"
                style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}>
                Hiring overview
              </h1>
              <p className="max-w-[620px] text-[14px] leading-[1.6] text-paper/70">
                {insight}
              </p>
            </div>
            <div className="flex flex-wrap gap-2.5 [&_a]:min-h-11">
              <Button asChild className="rounded-lg border border-paper/[0.16] bg-paper/[0.06] text-paper hover:bg-paper/[0.12]">
                <Link href="/admin/jobs">View jobs</Link>
              </Button>
              <Button asChild className="rounded-lg border border-paper/[0.16] bg-paper/[0.06] text-paper hover:bg-paper/[0.12]">
                <Link href="/" target="_blank">
                  View site <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
                </Link>
              </Button>
              <Button asChild>
                <Link href="/admin/jobs/new" className="inline-flex items-center gap-1.5">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                  Create job
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section aria-label="Hiring totals" className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Active jobs" value={activeJobs.length} hint="Published and open to applicants" icon={Briefcase} accent="green" />
          <StatCard label="Draft jobs" value={draftJobs.length} hint="Saved but not yet published" icon={FileEdit} accent="amber" />
          <StatCard label="Total applicants" value={totalApplicants} hint={`Across all ${jobs.length} jobs`} icon={Users} accent="cyan" />
          <StatCard label="New this week" value={newApplicantsThisWeek} hint="Applicants in the last 7 days" icon={UserPlus} accent="peri" />
        </section>

        {/* Charts */}
        <DeferredDashboardCharts
          stageDistribution={chartStageDistribution}
          applicantTrend={applicantTrend}
        />

      </div>
    </div>
  );
}
