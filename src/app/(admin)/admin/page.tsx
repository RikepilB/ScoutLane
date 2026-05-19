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
  accent: "green" | "amber" | "cyan" | "peri";
}

const accentMap: Record<StatCardProps["accent"], { bg: string; fg: string }> = {
  green: { bg: "bg-[rgba(45,138,106,0.12)]", fg: "text-[#2d8a6a]" },
  amber: { bg: "bg-[rgba(200,140,40,0.12)]", fg: "text-[#c88c28]" },
  cyan: { bg: "bg-[rgba(45,111,138,0.12)]", fg: "text-[#2d6f8a]" },
  peri: { bg: "bg-[rgba(118,146,255,0.14)]", fg: "text-[#3D518C]" },
};

function StatCard({ label, value, hint, icon: Icon, accent }: StatCardProps) {
  const a = accentMap[accent];
  return (
    <article className="flex items-start gap-3.5 rounded-2xl border border-[#d4d9df] bg-white p-[18px] shadow-[0_1px_3px_rgba(9,21,64,0.06),0_1px_2px_rgba(9,21,64,0.04)] transition-all hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(9,21,64,0.08),0_2px_4px_rgba(9,21,64,0.04)]">
      <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[10px] ${a.bg} ${a.fg}`}>
        <Icon className="h-[17px] w-[17px]" />
      </div>
      <div>
        <div className="text-[12.5px] text-[#5f8ea0]">{label}</div>
        <div className="mt-1 text-[30px] leading-none tracking-[-0.02em] text-[#0c1529]" style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}>
          {value}
        </div>
        {hint ? <div className="mt-1.5 text-[11.5px] text-[#5f8ea0]">{hint}</div> : null}
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
  const dailyCounts: Array<{ createdAt: Date }> = await prisma.applicant.findMany({
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
    <main className="flex-1" style={{ background: "#f1f5f9" }}>
      <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-6 px-10 py-8">
        {/* Hero */}
        <section className="animate-fade-up relative overflow-hidden rounded-[24px] p-9 text-white shadow-[0_12px_32px_rgba(9,21,64,0.10),0_4px_8px_rgba(9,21,64,0.06)]"
          style={{
            background: "radial-gradient(circle at 8% 20%, rgba(27,44,193,0.45), transparent 55%), linear-gradient(170deg, #091540 0%, #0c1529 70%)",
          }}>
          <div className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage: "linear-gradient(rgba(118,146,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(118,146,255,0.05) 1px, transparent 1px)",
              backgroundSize: "56px 56px",
              WebkitMaskImage: "radial-gradient(ellipse at 75% 50%, black 25%, transparent 75%)",
              maskImage: "radial-gradient(ellipse at 75% 50%, black 25%, transparent 75%)",
            }}
          />

          <div className="relative flex flex-wrap items-end justify-between gap-6">
            <div>
              <div className="mb-3.5 flex items-center gap-2.5 text-[11px] font-medium uppercase tracking-[0.16em] text-[#ABD2FA]"
                style={{ fontFamily: "var(--font-mono)" }}>
                <span className="h-px w-5 bg-[#ABD2FA]" />
                Recruitment cockpit
              </div>
              <h1 className="mb-2.5 text-[40px] leading-none tracking-[-0.03em]"
                style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}>
                Admin dashboard
              </h1>
              <p className="max-w-[520px] text-[14px] leading-[1.55] text-white/65">
                Quick snapshot of hiring activity. Open the Jobs list to manage roles and review applicants by stage.
              </p>
            </div>
            <div className="flex gap-2.5">
              <Button asChild className="rounded-lg border border-white/[0.16] bg-white/[0.06] text-white hover:bg-white/[0.12]">
                <Link href="/admin/jobs">View jobs</Link>
              </Button>
              <Button asChild className="rounded-lg border border-white/[0.16] bg-white/[0.06] text-white hover:bg-white/[0.12]">
                <Link href="/" target="_blank">
                  View site <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
                </Link>
              </Button>
              <Button asChild className="rounded-lg bg-gradient-to-b from-[#1B2CC1] to-[#161fa8] text-white shadow-[0_1px_3px_rgba(9,21,64,0.06),0_1px_2px_rgba(9,21,64,0.04),inset_0_1px_0_rgba(255,255,255,0.16)] hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(9,21,64,0.08),0_2px_4px_rgba(9,21,64,0.04)]">
                <Link href="/admin/jobs/new" className="inline-flex items-center gap-1.5">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                  Create job
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="animate-fade-up animate-fade-up-delay-1 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Active jobs" value={activeJobs.length} hint="Published and open to applicants" icon={Briefcase} accent="green" />
          <StatCard label="Draft jobs" value={draftJobs.length} hint="Saved but not yet published" icon={FileEdit} accent="amber" />
          <StatCard label="Total applicants" value={totalApplicants} hint={`Across all ${jobs.length} jobs`} icon={Users} accent="cyan" />
          <StatCard label="New this week" value={newApplicantsThisWeek} hint="Applicants in the last 7 days" icon={UserPlus} accent="peri" />
        </section>

        {/* Charts */}
        <section className="animate-fade-up animate-fade-up-delay-2 grid gap-4 lg:grid-cols-2">
          <StageDistributionChart
            data={stageDistribution.map((s) => ({ status: s.status, count: s._count.id }))}
          />
          <ApplicantTrendChart data={applicantTrend} />
        </section>

        {/* Manage card */}
        <section className="animate-fade-up animate-fade-up-delay-3 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-dashed border-[#d4d9df] bg-white px-6 py-5 shadow-[0_1px_3px_rgba(9,21,64,0.06),0_1px_2px_rgba(9,21,64,0.04)]">
          <div>
            <h2 className="text-[15px] font-semibold text-[#0c1529]" style={{ fontFamily: "var(--font-display)" }}>
              Manage all jobs
            </h2>
            <p className="text-[13px] text-[#5f8ea0]">
              Filter by status, review applicant counts, and jump into the public page.
            </p>
          </div>
          <Button asChild variant="outline" className="gap-1.5 rounded-lg border-[#d4d9df] text-[#0c1529] hover:bg-[#f1f5f9]">
            <Link href="/admin/jobs">
              Open jobs list <ArrowUpRight className="h-3 w-3" />
            </Link>
          </Button>
        </section>
      </div>
    </main>
  );
}
