import Link from "next/link";
import { ExternalLink, Plus } from "lucide-react";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import { getJobStatus } from "@/lib/jobs";
import type { JobStatus } from "@/schemas/job";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { EmptyState } from "@/components/admin/EmptyState";
import { JobRowActions } from "@/components/admin/JobRowActions";
import { getCurrentUserWithOrganization } from "@/server/services/current-user";

export const dynamic = "force-dynamic";

type FilterValue = "all" | JobStatus;

const filters: { value: FilterValue; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "draft", label: "Draft" },
  { value: "closed", label: "Closed" },
];

function parseFilter(value: string | undefined): FilterValue {
  if (value === "active" || value === "draft" || value === "closed") return value;
  return "all";
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function JobsListPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const filter = parseFilter(params.status);

  const user = await getCurrentUserWithOrganization();
  const organizationId = user?.organizationId;

  type JobListRow = Prisma.JobGetPayload<{
    include: { _count: { select: { applicants: true } } };
  }>;

  const jobs: JobListRow[] = organizationId
    ? await prisma.job.findMany({
        where: { organizationId },
        include: { _count: { select: { applicants: true } } },
        orderBy: { createdAt: "desc" },
      })
    : [];

  const withStatus = jobs.map((job) => ({ ...job, status: getJobStatus(job) }));
  const visible = filter === "all" ? withStatus : withStatus.filter((j) => j.status === filter);

  const counts = {
    all: withStatus.length,
    active: withStatus.filter((j) => j.status === "active").length,
    draft: withStatus.filter((j) => j.status === "draft").length,
    closed: withStatus.filter((j) => j.status === "closed").length,
  };

  return (
    <main className="flex-1" style={{ background: "#F9FAFB" }}>
      <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-5 px-10 py-8">
        {/* Page header */}
        <header className="animate-fade-up flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.16em] text-[#6B7280]"
              style={{ fontFamily: "var(--font-mono)" }}>
              Jobs
            </p>
            <h1 className="text-[32px] tracking-[-0.02em] text-[#0B1437]"
              style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}>
              {user?.role === "ADMIN" ? "All jobs" : "My jobs"}
            </h1>
            <p className="text-[13.5px] text-[#6B7280]">
              {user?.role === "ADMIN"
                ? "Manage roles, review applicants, and publish public application links."
                : "Jobs assigned to you — manage applicants and pipelines."}
            </p>
          </div>
          {user?.role === "ADMIN" ? (
            <Button asChild className="rounded-lg bg-gradient-to-b from-[#2B4BFF] to-[#1A2EFF] text-white shadow-[0_1px_3px_rgba(9,21,64,0.06),0_1px_2px_rgba(9,21,64,0.04),inset_0_1px_0_rgba(255,255,255,0.16)] hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(9,21,64,0.08),0_2px_4px_rgba(9,21,64,0.04)]">
              <Link href="/admin/jobs/new" className="inline-flex items-center gap-1.5">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                Create job
              </Link>
            </Button>
          ) : null}
        </header>

        {/* Filter tabs */}
        <div className="animate-fade-up animate-fade-up-delay-1 flex flex-wrap items-center gap-1.5">
          {filters.map((f) => (
            <Link
              key={f.value}
              href={f.value === "all" ? "/admin/jobs" : `/admin/jobs?status=${f.value}`}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-all duration-[0.16s]",
                filter === f.value
                  ? "border-[#0B1437] bg-[#0B1437] text-white"
                  : "border-[#E5E7EB] bg-white text-[#6B7280] hover:bg-[#F9FAFB] hover:text-[#0B1437]",
              )}
            >
              {f.label}
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[11px]",
                  filter === f.value ? "bg-white/15" : "bg-[#E5E7EB]",
                )}
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {counts[f.value]}
              </span>
            </Link>
          ))}
        </div>

        {visible.length === 0 ? (
          <EmptyState
            message={filter === "all" ? "No jobs yet. Create your first role to get started." : `No ${filter} jobs.`}
            actionLabel={filter === "all" ? "Create your first job" : undefined}
            actionHref={filter === "all" ? "/admin/jobs/new" : undefined}
          />
        ) : (
          <div className="animate-fade-up animate-fade-up-delay-2 overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-[0_1px_3px_rgba(9,21,64,0.06),0_1px_2px_rgba(9,21,64,0.04)]">
            <table className="w-full text-[13.5px]">
              <thead>
                <tr className="border-b border-[#E5E7EB]">
                  <th className="px-4 py-2.5 text-left text-[10.5px] font-semibold uppercase tracking-[0.10em] text-[#6B7280]"
                    style={{ fontFamily: "var(--font-mono)" }}>
                    Title
                  </th>
                  <th className="px-4 py-2.5 text-left text-[10.5px] font-semibold uppercase tracking-[0.10em] text-[#6B7280]"
                    style={{ fontFamily: "var(--font-mono)" }}>
                    Status
                  </th>
                  <th className="px-4 py-2.5 text-left text-[10.5px] font-semibold uppercase tracking-[0.10em] text-[#6B7280]"
                    style={{ fontFamily: "var(--font-mono)" }}>
                    Applicants
                  </th>
                  <th className="px-4 py-2.5 text-left text-[10.5px] font-semibold uppercase tracking-[0.10em] text-[#6B7280]"
                    style={{ fontFamily: "var(--font-mono)" }}>
                    Location
                  </th>
                  <th className="px-4 py-2.5 text-left text-[10.5px] font-semibold uppercase tracking-[0.10em] text-[#6B7280]"
                    style={{ fontFamily: "var(--font-mono)" }}>
                    Type
                  </th>
                  <th className="px-4 py-2.5 text-left text-[10.5px] font-semibold uppercase tracking-[0.10em] text-[#6B7280]"
                    style={{ fontFamily: "var(--font-mono)" }}>
                    Created
                  </th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {visible.map((job) => (
                  <tr key={job.id} className="border-b border-[rgba(9,21,64,0.06)] transition-colors hover:bg-[#F9FAFB]">
                    <td className="px-4 py-3.5">
                      <Link
                        href={`/admin/jobs/${job.id}`}
                        className="text-[13.5px] font-medium text-[#0B1437] transition-colors hover:text-[#2B4BFF]"
                      >
                        {job.title}
                      </Link>
                      <div className="mt-0.5 flex items-center gap-1 text-[11px] text-[#6B7280]"
                        style={{ fontFamily: "var(--font-mono)" }}>
                        <span className="truncate">/{job.slug}</span>
                        <Link
                          href={`/careers/${job.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex shrink-0 text-[#6B7280]/60 hover:text-[#6B7280]"
                          title="Open public page"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={job.status} />
                    </td>
                    <td className="px-4 py-3.5 text-[13px] text-[#374151]">{job._count.applicants}</td>
                    <td className="px-4 py-3.5 text-[13px] text-[#374151]">
                      {job.location ?? <span className="text-[#6B7280]">—</span>}
                    </td>
                    <td className="px-4 py-3.5 text-[13px] text-[#374151]">
                      {job.type ?? <span className="text-[#6B7280]">—</span>}
                    </td>
                    <td className="px-4 py-3.5 text-[13px] text-[#6B7280]">
                      {formatDate(job.createdAt)}
                    </td>
                    <td className="px-4 py-3.5">
                      <JobRowActions jobId={job.id} status={job.status} role={user?.role} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
