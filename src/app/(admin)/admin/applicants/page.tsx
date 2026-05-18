import Link from "next/link";
import { ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";
import type { Prisma, ApplicationStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import { EmptyState } from "@/components/admin/EmptyState";
import { getCurrentUserWithOrganization } from "@/server/services/current-user";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 10;

const STATUS_ORDER: ApplicationStatus[] = [
  "NEW",
  "REVIEWING",
  "SHORTLISTED",
  "INTERVIEW",
  "OFFERED",
  "REJECTED",
  "WITHDRAWN",
];

const STATUS_BADGE_COLORS: Record<string, string> = {
  NEW: "bg-indigo-50 text-indigo-700",
  REVIEWING: "bg-amber-50 text-amber-700",
  SHORTLISTED: "bg-sky-50 text-sky-700",
  INTERVIEW: "bg-blue-50 text-blue-700",
  OFFERED: "bg-emerald-50 text-emerald-700",
  REJECTED: "bg-red-50 text-red-700",
  WITHDRAWN: "bg-slate-100 text-slate-600",
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function getStageName(stage: { name: string } | null): string {
  return stage?.name ?? "Unassigned";
}

function matchBadgeColor(score: number | null): string {
  if (score === null) return "bg-slate-100 text-slate-500";
  if (score >= 0.75) return "bg-emerald-50 text-emerald-700";
  if (score >= 0.5) return "bg-amber-50 text-amber-700";
  if (score >= 0.3) return "bg-slate-100 text-slate-600";
  return "bg-red-50 text-red-700";
}

function formatMatchScore(score: number | null): string {
  if (score === null) return "—";
  return `${Math.round(score * 100)}%`;
}

export default async function GlobalApplicantsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const user = await getCurrentUserWithOrganization();
  const organizationId = user?.organizationId;

  const filters = await searchParams;

  function buildHref(updates: Record<string, string | undefined>): string {
    const params = new URLSearchParams();
    const current = { ...filters, ...updates };
    for (const [k, v] of Object.entries(current)) {
      if (v) params.set(k, v);
    }
    const qs = params.toString();
    return `/admin/applicants${qs ? `?${qs}` : ""}`;
  }

  if (!organizationId) {
    return (
      <main className="flex-1 bg-background">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10">
          <header className="flex flex-col gap-1">
            <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Applicants</p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">All applicants</h1>
            <p className="text-sm text-muted-foreground">
              Applications appear here once candidates submit them.
            </p>
          </header>
          <EmptyState message="No applicants yet. Applications from the public career page will show here." />
        </div>
      </main>
    );
  }

  const page = Math.max(1, parseInt(filters.page ?? "1", 10) || 1);
  const currentStatus = STATUS_ORDER.includes(filters.status as ApplicationStatus)
    ? (filters.status as ApplicationStatus)
    : undefined;

  type ApplicantRow = Prisma.ApplicantGetPayload<{
    include: {
      job: { select: { id: true; title: true; slug: true } };
      pipelineStage: { select: { name: true } };
    };
  }>;

  const baseWhere: Prisma.ApplicantWhereInput = { job: { organizationId } };
  const filteredWhere: Prisma.ApplicantWhereInput = currentStatus
    ? { ...baseWhere, status: currentStatus }
    : baseWhere;

  const [applicants, filteredCount, statusCounts] = await Promise.all([
    prisma.applicant.findMany({
      where: filteredWhere,
      include: {
        job: { select: { id: true, title: true, slug: true } },
        pipelineStage: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.applicant.count({ where: filteredWhere }),
    prisma.applicant.groupBy({
      by: ["status"],
      where: baseWhere,
      _count: true,
    }),
  ]);

  const totalApplicants = statusCounts.reduce((sum, s) => sum + s._count, 0);

  const countMap = new Map<string, number>();
  for (const entry of statusCounts) {
    countMap.set(entry.status, entry._count);
  }

  if (totalApplicants === 0) {
    return (
      <main className="flex-1 bg-background">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10">
          <header className="flex flex-col gap-1">
            <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Applicants</p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">All applicants</h1>
            <p className="text-sm text-muted-foreground">
              Applications appear here once candidates submit them.
            </p>
          </header>
          <EmptyState message="No applicants yet. Applications from the public career page will show here." />
        </div>
      </main>
    );
  }

  const totalPages = Math.ceil(filteredCount / PAGE_SIZE);

  return (
    <main className="flex-1 bg-background">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10">
        <header className="flex flex-col gap-1">
          <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Applicants</p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">All applicants</h1>
          <p className="text-sm text-muted-foreground">
            {totalApplicants} applicant{totalApplicants !== 1 ? "s" : ""} across all jobs
          </p>
        </header>

        {/* Status filter pills */}
        <div className="flex flex-wrap gap-2">
          <Link
            href={buildHref({ status: undefined, page: "1" })}
            className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
              !currentStatus
                ? "bg-slate-950 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <span className="font-semibold">{totalApplicants}</span> Total
          </Link>
          {STATUS_ORDER.map((s) => {
            const count = countMap.get(s) ?? 0;
            return (
              <Link
                key={s}
                href={buildHref({ status: s, page: "1" })}
                className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                  currentStatus === s
                    ? "bg-slate-950 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                <span className="font-semibold">{count}</span> {s}
              </Link>
            );
          })}
        </div>

        {/* Applicants table */}
        {filteredCount === 0 ? (
          <div className="rounded-3xl border border-border/70 bg-card px-6 py-12 text-center text-sm text-muted-foreground">
            No applicants with <span className="font-medium text-slate-950">{currentStatus}</span> status.
          </div>
        ) : (
          <>
            <div className="overflow-hidden rounded-3xl border border-border/70 bg-card shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3 font-medium">Name</th>
                    <th className="px-5 py-3 font-medium">Email</th>
                    <th className="px-5 py-3 font-medium">Job</th>
                    <th className="px-5 py-3 font-medium">Stage</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">Match</th>
                    <th className="px-5 py-3 font-medium">Applied</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {applicants.map((a: ApplicantRow) => (
                    <tr key={a.id} className="hover:bg-muted/20">
                      <td className="px-5 py-4">
                        <div className="font-medium text-slate-950">{a.name}</div>
                      </td>
                      <td className="px-5 py-4 text-slate-700">{a.email ?? "—"}</td>
                      <td className="px-5 py-4 text-slate-700">
                        <Link
                          href={`/admin/jobs/${a.job.id}`}
                          className="underline-offset-2 hover:underline"
                        >
                          {a.job.title}
                        </Link>
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                          {getStageName(a.pipelineStage)}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            STATUS_BADGE_COLORS[a.status] || "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {a.status}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${matchBadgeColor(a.score)}`}
                        >
                          {formatMatchScore(a.score)}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-muted-foreground">
                        {formatDate(a.createdAt)}
                      </td>
                      <td className="px-5 py-4">
                        <Link
                          href={`/admin/jobs/${a.job.id}/applicants/${a.id}`}
                          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                        >
                          View
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between gap-4 text-sm text-muted-foreground">
                <p>
                  Showing {(page - 1) * PAGE_SIZE + 1}–
                  {Math.min(page * PAGE_SIZE, filteredCount)} of {filteredCount} applicant
                  {filteredCount !== 1 ? "s" : ""}
                </p>
                <div className="flex items-center gap-2">
                  {page > 1 ? (
                    <Link
                      href={buildHref({ page: String(page - 1) })}
                      className="inline-flex items-center gap-1 rounded-lg border border-border/70 px-3 py-1.5 text-xs font-medium hover:bg-muted/30"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                      Previous
                    </Link>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-lg border border-border/30 px-3 py-1.5 text-xs font-medium text-muted-foreground/40">
                      <ChevronLeft className="h-3.5 w-3.5" />
                      Previous
                    </span>
                  )}
                  <span className="text-xs">
                    Page {page} of {totalPages}
                  </span>
                  {page < totalPages ? (
                    <Link
                      href={buildHref({ page: String(page + 1) })}
                      className="inline-flex items-center gap-1 rounded-lg border border-border/70 px-3 py-1.5 text-xs font-medium hover:bg-muted/30"
                    >
                      Next
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-lg border border-border/30 px-3 py-1.5 text-xs font-medium text-muted-foreground/40">
                      Next
                      <ChevronRight className="h-3.5 w-3.5" />
                    </span>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
