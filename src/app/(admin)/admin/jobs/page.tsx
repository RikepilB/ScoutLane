import Link from "next/link";
import { ExternalLink, Plus } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { getJobStatus } from "@/lib/jobs";
import type { JobStatus } from "@/schemas/job";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { EmptyState } from "@/components/admin/EmptyState";

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

  const jobs = await prisma.job.findMany({
    include: { _count: { select: { applicants: true } } },
    orderBy: { createdAt: "desc" },
  });

  const withStatus = jobs.map((job) => ({ ...job, status: getJobStatus(job) }));
  const visible = filter === "all" ? withStatus : withStatus.filter((j) => j.status === filter);

  const counts = {
    all: withStatus.length,
    active: withStatus.filter((j) => j.status === "active").length,
    draft: withStatus.filter((j) => j.status === "draft").length,
    closed: withStatus.filter((j) => j.status === "closed").length,
  };

  return (
    <main className="flex-1 bg-background">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Jobs</p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">All jobs</h1>
            <p className="text-sm text-muted-foreground">
              Manage roles, review applicants, and publish public application links.
            </p>
          </div>
          <Button asChild>
            <Link href="/admin/jobs/new" className="inline-flex items-center gap-1">
              <Plus className="h-4 w-4" />
              Create job
            </Link>
          </Button>
        </header>

        <div className="flex flex-wrap items-center gap-2">
          {filters.map((f) => (
            <Link
              key={f.value}
              href={f.value === "all" ? "/admin/jobs" : `/admin/jobs?status=${f.value}`}
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                filter === f.value
                  ? "bg-slate-950 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200",
              )}
            >
              {f.label}
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px]",
                  filter === f.value ? "bg-white/20" : "bg-white/80",
                )}
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
          <div className="overflow-hidden rounded-3xl border border-border/70 bg-card shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-medium">Title</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Applicants</th>
                  <th className="px-5 py-3 font-medium">Location</th>
                  <th className="px-5 py-3 font-medium">Type</th>
                  <th className="px-5 py-3 font-medium">Created</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {visible.map((job) => (
                  <tr key={job.id} className="hover:bg-muted/20">
                    <td className="px-5 py-4">
                      <div className="font-medium text-slate-950">{job.title}</div>
                      <div className="mt-0.5 truncate text-xs text-muted-foreground">
                        /{job.slug}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={job.status} />
                    </td>
                    <td className="px-5 py-4 text-slate-700">{job._count.applicants}</td>
                    <td className="px-5 py-4 text-slate-700">
                      {job.location ?? <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-5 py-4 text-slate-700">
                      {job.type ?? <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">
                      {formatDate(job.createdAt)}
                    </td>
                    <td className="px-5 py-4">
                      <Link
                        href={`/careers/${job.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                      >
                        Public page
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
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
