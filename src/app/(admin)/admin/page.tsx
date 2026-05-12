import Link from "next/link";
import { ArrowUpRight, Briefcase, FileEdit, UserPlus, Users } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { getJobStatus } from "@/lib/jobs";
import { Button } from "@/components/ui/button";
import { StageDistributionChart, ApplicantTrendChart } from "@/components/dashboard/Charts";

export const dynamic = "force-dynamic";

interface StatCardProps {
  label: string;
  value: number;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: "sky" | "amber" | "emerald" | "violet";
}

const accentMap: Record<StatCardProps["accent"], string> = {
  sky: "bg-sky-50 text-sky-700",
  amber: "bg-amber-50 text-amber-700",
  emerald: "bg-emerald-50 text-emerald-700",
  violet: "bg-violet-50 text-violet-700",
};

function StatCard({ label, value, hint, icon: Icon, accent }: StatCardProps) {
  return (
    <article className="flex items-start gap-4 rounded-3xl border border-border/70 bg-card p-5 shadow-sm">
      <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${accentMap[accent]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1">
        <div className="text-sm text-muted-foreground">{label}</div>
        <div className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">{value}</div>
        {hint ? <div className="mt-1 text-xs text-muted-foreground">{hint}</div> : null}
      </div>
    </article>
  );
}

export default async function AdminDashboardPage() {
  const jobs = await prisma.job.findMany({
    include: { _count: { select: { applicants: true } } },
    orderBy: { createdAt: "desc" },
  });

  const activeJobs = jobs.filter((j) => getJobStatus(j) === "active");
  const draftJobs = jobs.filter((j) => getJobStatus(j) === "draft");
  const totalApplicants = jobs.reduce((sum, j) => sum + j._count.applicants, 0);

  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const newApplicantsThisWeek = await prisma.applicant.count({
    where: { createdAt: { gte: oneWeekAgo } },
  });

  const stageDistribution = await prisma.applicant.groupBy({
    by: ["status"],
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
  });

  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  const dailyCounts = await prisma.applicant.findMany({
    where: { createdAt: { gte: fourteenDaysAgo } },
    select: { createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const dailyMap = new Map<string, number>();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    dailyMap.set(d.toLocaleDateString("en-US", { month: "short", day: "numeric" }), 0);
  }
  for (const a of dailyCounts) {
    const key = a.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    dailyMap.set(key, (dailyMap.get(key) ?? 0) + 1);
  }
  const applicantTrend = Array.from(dailyMap.entries()).map(([date, count]) => ({ date, count }));

  return (
    <main className="flex-1 bg-background">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10">
        <section className="rounded-[2rem] border border-border/70 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-8 text-white shadow-sm">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="space-y-3">
              <p className="text-sm uppercase tracking-[0.24em] text-sky-200/80">
                Recruitment cockpit
              </p>
              <h1 className="text-4xl font-semibold tracking-tight">Admin dashboard</h1>
              <p className="max-w-2xl text-sm text-slate-300">
                Quick snapshot of hiring activity. Open the Jobs list to manage roles and review
                applicants by stage.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button asChild variant="secondary">
                <Link href="/admin/jobs">View jobs</Link>
              </Button>
              <Button asChild>
                <Link href="/admin/jobs/new">Create job</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Active jobs"
            value={activeJobs.length}
            hint="Published and open to applicants"
            icon={Briefcase}
            accent="emerald"
          />
          <StatCard
            label="Draft jobs"
            value={draftJobs.length}
            hint="Saved but not yet published"
            icon={FileEdit}
            accent="amber"
          />
          <StatCard
            label="Total applicants"
            value={totalApplicants}
            hint={`Across all ${jobs.length} jobs`}
            icon={Users}
            accent="sky"
          />
          <StatCard
            label="New this week"
            value={newApplicantsThisWeek}
            hint="Applicants in the last 7 days"
            icon={UserPlus}
            accent="violet"
          />
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <StageDistributionChart
            data={stageDistribution.map((s) => ({ status: s.status, count: s._count.id }))}
          />
          <ApplicantTrendChart data={applicantTrend} />
        </section>

        <section className="rounded-3xl border border-dashed border-border bg-muted/30 p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold tracking-tight">Manage all jobs</h2>
              <p className="text-sm text-muted-foreground">
                Filter by status, review applicant counts, and jump into the public page.
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href="/admin/jobs" className="inline-flex items-center gap-1">
                Open jobs list <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      </div>
    </main>
  );
}
