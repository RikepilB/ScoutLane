import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, Globe, MapPin, Briefcase, DollarSign } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { getJobStatus } from "@/lib/jobs";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { StatusBadge } from "@/components/admin/StatusBadge";

interface OverviewPageProps {
  params: Promise<{ id: string }>;
}

export default async function JobOverviewPage({ params }: OverviewPageProps) {
  const { id } = await params;

  const job = await prisma.job.findUnique({
    where: { id },
    include: {
      _count: { select: { applicants: true } },
      stages: { orderBy: { order: "asc" } },
    },
  });

  if (!job) notFound();

  const status = getJobStatus(job);

  const statusCounts = await prisma.applicant.groupBy({
    by: ["status"],
    where: { jobId: id },
    _count: { id: true },
  });
  const countMap = Object.fromEntries(
    statusCounts.map((s) => [s.status, s._count.id]),
  );
  const stageCounts = job.stages.map((stage) => ({
    ...stage,
    count: countMap[stage.name.toUpperCase()] ?? 0,
  }));

  return (
    <div className="space-y-8">
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
        {stageCounts.map((stage) => (
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

      <section className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
        <h3 className="text-base font-semibold tracking-tight">Quick actions</h3>
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
