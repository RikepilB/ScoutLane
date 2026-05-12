import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { getJobStatus } from "@/lib/jobs";
import { Button } from "@/components/ui/button";

const sectionOrder = ["active", "draft", "closed"] as const;

export default async function AdminDashboardPage() {
  const jobs = await prisma.job.findMany({
    include: {
      _count: {
        select: {
          applicants: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const groupedJobs = sectionOrder.map((status) => ({
    status,
    jobs: jobs.filter((job) => getJobStatus(job) === status),
  }));

  const activeJobs = groupedJobs.find((group) => group.status === "active")?.jobs ?? [];
  const activeApplicantCount = activeJobs.reduce((sum, job) => sum + job._count.applicants, 0);

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10">
        <section className="rounded-[2rem] border border-border/70 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-8 text-white shadow-sm">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="space-y-3">
              <p className="text-sm uppercase tracking-[0.24em] text-sky-200/80">
                Recruitment cockpit
              </p>
              <h1 className="text-4xl font-semibold tracking-tight">Admin dashboard</h1>
              <p className="max-w-2xl text-sm text-slate-300">
                Review jobs by status, monitor current applicant volume, and jump straight
                into creating the next role.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:min-w-80">
              <div className="rounded-2xl bg-white/8 p-4">
                <div className="text-sm text-slate-300">Active jobs</div>
                <div className="mt-2 text-3xl font-semibold">{activeJobs.length}</div>
              </div>
              <div className="rounded-2xl bg-white/8 p-4">
                <div className="text-sm text-slate-300">Applicants in active roles</div>
                <div className="mt-2 text-3xl font-semibold">{activeApplicantCount}</div>
              </div>
            </div>
          </div>
        </section>

        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Job workspaces</h2>
            <p className="text-sm text-muted-foreground">
              Each job keeps its own applicant flow and analytics context.
            </p>
          </div>

          <Button asChild>
            <Link href="/admin/jobs/new">Create job</Link>
          </Button>
        </div>

        <div className="grid gap-6">
          {groupedJobs.map((group) => (
            <section key={group.status} className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold capitalize">{group.status}</h3>
                <span className="text-sm text-muted-foreground">{group.jobs.length} jobs</span>
              </div>

              {group.jobs.length ? (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {group.jobs.map((job) => (
                    <article
                      key={job.id}
                      className="rounded-3xl border border-border/70 bg-card p-5 shadow-sm"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <h4 className="text-lg font-semibold tracking-tight">{job.title}</h4>
                        <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium capitalize text-muted-foreground">
                          {group.status}
                        </span>
                      </div>
                      <p className="mt-3 line-clamp-4 text-sm leading-6 text-muted-foreground">
                        {job.description || "No job description added yet."}
                      </p>
                      <div className="mt-5 flex items-center justify-between text-sm text-muted-foreground">
                        <span>{job._count.applicants} applicants</span>
                        <Link className="font-medium text-primary" href={`/careers/${job.slug}`}>
                          Public page
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="rounded-3xl border border-dashed border-border bg-muted/20 p-6 text-sm text-muted-foreground">
                  No {group.status} jobs yet.
                </div>
              )}
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
