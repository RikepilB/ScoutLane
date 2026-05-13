import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getJobStatus } from "@/lib/jobs";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { JobTabs } from "./_components/JobTabs";
import { getCurrentUserWithOrganization } from "@/server/services/current-user";

const statusStyles: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  draft: "bg-amber-50 text-amber-700 ring-amber-200",
  closed: "bg-slate-100 text-slate-600 ring-slate-200",
};

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}

export default async function JobDetailLayout({ children, params }: LayoutProps) {
  const { id } = await params;
  const user = await getCurrentUserWithOrganization();

  const job = await prisma.job.findFirst({
    where: { id, organizationId: user?.organizationId ?? undefined },
    include: { _count: { select: { applicants: true } } },
  });

  if (!job) notFound();

  const status = getJobStatus(job);

  return (
    <div className="flex-1 bg-background">
      <div className="mx-auto flex w-full max-w-6xl flex-col px-6">
        <div className="flex items-center gap-3 border-b border-border/70 py-4">
          <Link
            href="/admin/jobs"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Jobs
          </Link>
          <span className="text-muted-foreground/40">/</span>
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold tracking-tight">{job.title}</h1>
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ring-1 ring-inset",
                statusStyles[status],
              )}
            >
              {status}
            </span>
          </div>
        </div>

        <JobTabs jobId={id} />

        <div className="py-6">{children}</div>
      </div>
    </div>
  );
}
