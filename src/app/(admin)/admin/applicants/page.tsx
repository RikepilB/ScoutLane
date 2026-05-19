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
  NEW: "bg-[rgba(27,44,193,0.10)] text-[#1B2CC1]",
  REVIEWING: "bg-[rgba(200,140,40,0.12)] text-[#c88c28]",
  SHORTLISTED: "bg-[rgba(45,111,138,0.12)] text-[#2d6f8a]",
  INTERVIEW: "bg-[rgba(118,146,255,0.14)] text-[#3D518C]",
  OFFERED: "bg-[rgba(45,138,106,0.12)] text-[#2d8a6a]",
  REJECTED: "bg-[rgba(201,58,58,0.12)] text-[#c93a3a]",
  WITHDRAWN: "bg-[rgba(95,142,160,0.16)] text-[#5f8ea0]",
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
      <main className="flex-1" style={{ background: "#f1f5f9" }}>
        <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-5 px-10 py-8">
          <header className="animate-fade-up flex flex-col gap-1">
            <p className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.16em] text-[#5f8ea0]"
              style={{ fontFamily: "var(--font-mono)" }}>Applicants</p>
            <h1 className="text-[32px] tracking-[-0.02em] text-[#0c1529]"
              style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}>All applicants</h1>
            <p className="text-[13.5px] text-[#5f8ea0]">
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
      <main className="flex-1" style={{ background: "#f1f5f9" }}>
        <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-5 px-10 py-8">
          <header className="animate-fade-up flex flex-col gap-1">
            <p className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.16em] text-[#5f8ea0]"
              style={{ fontFamily: "var(--font-mono)" }}>Applicants</p>
            <h1 className="text-[32px] tracking-[-0.02em] text-[#0c1529]"
              style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}>All applicants</h1>
            <p className="text-[13.5px] text-[#5f8ea0]">
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
    <main className="flex-1" style={{ background: "#f1f5f9" }}>
      <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-5 px-10 py-8">
        <header className="animate-fade-up flex flex-col gap-1">
          <p className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.16em] text-[#5f8ea0]"
            style={{ fontFamily: "var(--font-mono)" }}>Applicants</p>
          <h1 className="text-[32px] tracking-[-0.02em] text-[#0c1529]"
            style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}>All applicants</h1>
          <p className="text-[13.5px] text-[#5f8ea0]">
            {totalApplicants} applicant{totalApplicants !== 1 ? "s" : ""} across all jobs
          </p>
        </header>

        {/* Status filter pills */}
        <div className="animate-fade-up animate-fade-up-delay-1 flex flex-wrap gap-2">
          <Link
            href={buildHref({ status: undefined, page: "1" })}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12.5px] font-medium transition-all duration-[0.16s] ${
              !currentStatus
                ? "border-[#0c1529] bg-[#0c1529] text-white"
                : "border-[#d4d9df] bg-white text-[#5f8ea0] hover:bg-[#f1f5f9] hover:text-[#0c1529]"
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
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12.5px] font-medium transition-all duration-[0.16s] ${
                  currentStatus === s
                    ? "border-[#0c1529] bg-[#0c1529] text-white"
                    : "border-[#d4d9df] bg-white text-[#5f8ea0] hover:bg-[#f1f5f9] hover:text-[#0c1529]"
                }`}
              >
                <span className="font-semibold">{count}</span> {s}
              </Link>
            );
          })}
        </div>

        {/* Applicants table */}
        {filteredCount === 0 ? (
          <div className="animate-fade-up animate-fade-up-delay-2 rounded-2xl border border-[#d4d9df] bg-white px-6 py-12 text-center shadow-[0_1px_3px_rgba(9,21,64,0.06),0_1px_2px_rgba(9,21,64,0.04)]">
            <p className="text-[13px] text-[#5f8ea0]">
              No applicants with <span className="font-medium text-[#0c1529]">{currentStatus}</span> status.
            </p>
          </div>
        ) : (
          <>
            <div className="animate-fade-up animate-fade-up-delay-2 overflow-hidden rounded-2xl border border-[#d4d9df] bg-white shadow-[0_1px_3px_rgba(9,21,64,0.06),0_1px_2px_rgba(9,21,64,0.04)]">
              <table className="w-full text-[13.5px]">
                <thead>
                  <tr className="border-b border-[#d4d9df]">
                    <th className="px-4 py-2.5 text-left text-[10.5px] font-semibold uppercase tracking-[0.10em] text-[#5f8ea0]"
                      style={{ fontFamily: "var(--font-mono)" }}>Name</th>
                    <th className="px-4 py-2.5 text-left text-[10.5px] font-semibold uppercase tracking-[0.10em] text-[#5f8ea0]"
                      style={{ fontFamily: "var(--font-mono)" }}>Email</th>
                    <th className="px-4 py-2.5 text-left text-[10.5px] font-semibold uppercase tracking-[0.10em] text-[#5f8ea0]"
                      style={{ fontFamily: "var(--font-mono)" }}>Job</th>
                    <th className="px-4 py-2.5 text-left text-[10.5px] font-semibold uppercase tracking-[0.10em] text-[#5f8ea0]"
                      style={{ fontFamily: "var(--font-mono)" }}>Stage</th>
                    <th className="px-4 py-2.5 text-left text-[10.5px] font-semibold uppercase tracking-[0.10em] text-[#5f8ea0]"
                      style={{ fontFamily: "var(--font-mono)" }}>Status</th>
                    <th className="px-4 py-2.5 text-left text-[10.5px] font-semibold uppercase tracking-[0.10em] text-[#5f8ea0]"
                      style={{ fontFamily: "var(--font-mono)" }}>Match</th>
                    <th className="px-4 py-2.5 text-left text-[10.5px] font-semibold uppercase tracking-[0.10em] text-[#5f8ea0]"
                      style={{ fontFamily: "var(--font-mono)" }}>Applied</th>
                    <th className="px-4 py-2.5" />
                  </tr>
                </thead>
                <tbody>
                  {applicants.map((a: ApplicantRow) => (
                    <tr key={a.id} className="border-b border-[rgba(9,21,64,0.06)] transition-colors hover:bg-[#f1f5f9]">
                      <td className="px-4 py-3.5">
                        <div className="text-[13.5px] font-medium text-[#0c1529]">{a.name}</div>
                      </td>
                      <td className="px-4 py-3.5 text-[13px] text-[#394050]">{a.email ?? "—"}</td>
                      <td className="px-4 py-3.5 text-[13px] text-[#394050]">
                        <Link
                          href={`/admin/jobs/${a.job.id}`}
                          className="underline-offset-2 hover:underline"
                        >
                          {a.job.title}
                        </Link>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center rounded-full bg-[#f1f5f9] border border-[#d4d9df] px-2.5 py-1 text-[11.5px] text-[#5f8ea0]">
                          {getStageName(a.pipelineStage)}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11.5px] font-medium uppercase tracking-[0.06em] ${STATUS_BADGE_COLORS[a.status] ?? "bg-[rgba(107,114,128,0.16)] text-[#5f8ea0]"}`}
                          style={{ fontFamily: "var(--font-mono)" }}>
                          {a.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-[11.5px] text-[#5f8ea0]"
                          style={{ fontFamily: "var(--font-mono)" }}>
                          {a.score !== null ? (
                            <span className="text-[#1B2CC1]">{formatMatchScore(a.score)}</span>
                          ) : "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-[13px] text-[#5f8ea0]">{formatDate(a.createdAt)}</td>
                      <td className="px-4 py-3.5">
                        <Link
                          href={`/admin/applicants/${a.id}`}
                          className="inline-flex items-center gap-1 text-[13px] font-medium text-[#1B2CC1] transition-colors hover:text-[#3D518C]"
                        >
                          View <ExternalLink className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between gap-4 px-1 pt-4 text-[13px] text-[#5f8ea0]">
                <p>
                  Showing {(page - 1) * PAGE_SIZE + 1}–
                  {Math.min(page * PAGE_SIZE, filteredCount)} of {filteredCount} applicant
                  {filteredCount !== 1 ? "s" : ""}
                </p>
                <div className="flex items-center gap-2">
                  {page > 1 ? (
                    <Link
                      href={buildHref({ page: String(page - 1) })}
                      className="inline-flex items-center gap-1 rounded-lg border border-[#d4d9df] bg-white px-3 py-1.5 text-[12px] font-medium text-[#0c1529] hover:bg-[#f1f5f9]"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                      Previous
                    </Link>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-lg border border-[rgba(9,21,64,0.04)] px-3 py-1.5 text-[12px] font-medium text-[#5f8ea0]/40">
                      <ChevronLeft className="h-3.5 w-3.5" />
                      Previous
                    </span>
                  )}
                  <span className="text-[12px]">
                    Page {page} of {totalPages}
                  </span>
                  {page < totalPages ? (
                    <Link
                      href={buildHref({ page: String(page + 1) })}
                      className="inline-flex items-center gap-1 rounded-lg border border-[#d4d9df] bg-white px-3 py-1.5 text-[12px] font-medium text-[#0c1529] hover:bg-[#f1f5f9]"
                    >
                      Next
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-lg border border-[rgba(9,21,64,0.04)] px-3 py-1.5 text-[12px] font-medium text-[#5f8ea0]/40">
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
