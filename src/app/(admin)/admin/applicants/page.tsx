import Link from "next/link";
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import { getJobStatus } from "@/lib/jobs";
import { EmptyState } from "@/components/admin/EmptyState";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { getCurrentUserWithOrganization } from "@/server/services/current-user";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 15;

interface Props {
  searchParams: Promise<{ page?: string }>;
}

export default async function GlobalApplicantsPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const user = await getCurrentUserWithOrganization();
  const organizationId = user?.organizationId;

  type JobWithStats = Prisma.JobGetPayload<{
    include: {
      _count: { select: { applicants: true } };
      stages: { select: { id: true; name: true; color: true } };
    };
  }>;

  const allJobs: JobWithStats[] = organizationId
    ? await prisma.job.findMany({
        where: { organizationId, applicants: { some: {} } },
        include: {
          _count: { select: { applicants: true } },
          stages: { select: { id: true, name: true, color: true } },
        },
        orderBy: { createdAt: "desc" },
      })
    : [];

  const totalJobs = allJobs.length;
  const totalPages = Math.ceil(totalJobs / PAGE_SIZE);
  const jobs = allJobs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const totalApplicants = allJobs.reduce((sum, j) => sum + j._count.applicants, 0);

  function buildPageUrl(p: number) {
    return p === 1 ? "/admin/applicants" : `/admin/applicants?page=${p}`;
  }

  function renderPageTabs(current: number, total: number) {
    if (total <= 1) return null;
    const pages: (number | "...")[] = [];
    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      pages.push(1);
      if (current > 3) pages.push("...");
      for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
        pages.push(i);
      }
      if (current < total - 2) pages.push("...");
      pages.push(total);
    }
    return (
      <div className="flex items-center gap-1.5">
        {current > 1 ? (
          <Link href={buildPageUrl(current - 1)} className="inline-flex items-center gap-1 rounded-lg border border-border/70 px-2.5 py-1.5 text-xs font-medium hover:bg-muted/30">
            <ChevronLeft className="h-3.5 w-3.5" />
          </Link>
        ) : null}
        {pages.map((p, i) =>
          p === "..." ? (
            <span key={`ellipsis-${i}`} className="px-1 text-xs text-muted-foreground">…</span>
          ) : (
            <Link
              key={p}
              href={buildPageUrl(p)}
              className={`inline-flex h-7 w-7 items-center justify-center rounded-lg text-xs font-medium ${
                p === current
                  ? "bg-slate-950 text-white"
                  : "border border-border/70 text-slate-700 hover:bg-muted/30"
              }`}
            >
              {p}
            </Link>
          ),
        )}
        {current < total ? (
          <Link href={buildPageUrl(current + 1)} className="inline-flex items-center gap-1 rounded-lg border border-border/70 px-2.5 py-1.5 text-xs font-medium hover:bg-muted/30">
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        ) : null}
      </div>
    );
  }

  return (
    <main className="flex-1 bg-background">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10">
        <header className="flex flex-col gap-1">
          <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Applicants</p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Jobs with applicants</h1>
          <p className="text-sm text-muted-foreground">
            {totalJobs} job{totalJobs !== 1 ? "s" : ""} — {totalApplicants} total applicant{totalApplicants !== 1 ? "s" : ""}
          </p>
        </header>

        {totalJobs === 0 ? (
          <EmptyState message="No applicants yet. Applications appear here once candidates submit them." />
        ) : (
          <>
            {renderPageTabs(page, totalPages)}

            <div className="overflow-hidden rounded-3xl border border-border/70 bg-card shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3 font-medium">Job</th>
                    <th className="px-5 py-3 font-medium">Applicants</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">Location</th>
                    <th className="px-5 py-3 font-medium">Type</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {jobs.map((job) => {
                    const status = getJobStatus(job);
                    return (
                      <tr key={job.id} className="hover:bg-muted/20">
                        <td className="px-5 py-4">
                          <Link
                            href={`/admin/jobs/${job.id}`}
                            className="font-medium text-slate-950 underline-offset-2 hover:underline"
                          >
                            {job.title}
                          </Link>
                          <div className="mt-0.5 text-xs text-muted-foreground">/{job.slug}</div>
                        </td>
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-900">
                            {job._count.applicants}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <StatusBadge status={status} />
                        </td>
                        <td className="px-5 py-4 text-slate-700">
                          {job.location ?? <span className="text-muted-foreground">—</span>}
                        </td>
                        <td className="px-5 py-4 text-slate-700">
                          {job.type ?? <span className="text-muted-foreground">—</span>}
                        </td>
                        <td className="px-5 py-4">
                          <Link
                            href={`/admin/jobs/${job.id}`}
                            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                          >
                            View
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {renderPageTabs(page, totalPages)}
          </>
        )}
      </div>
    </main>
  );
}
