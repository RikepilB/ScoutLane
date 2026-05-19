import { ApplicationForm } from "@/components/public/ApplicationForm";
import { prisma } from "@/lib/db/prisma";
import { getJobStatus } from "@/lib/jobs";
import { renderMarkdown } from "@/lib/utils/markdown";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Home, MapPin, Briefcase, DollarSign, ArrowLeft, Building } from "lucide-react";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `ScoutLane careers | ${slug}`,
    robots: {
      index: false,
      follow: false,
      nocache: true,
      noarchive: true,
      nosnippet: true,
      googleBot: {
        index: false,
        follow: false,
        noimageindex: true,
        noarchive: true,
        nosnippet: true,
        "max-snippet": 0,
        "max-image-preview": "none",
        "max-video-preview": -1,
      },
    },
    other: {
      "X-Robots-Tag": "noindex, nofollow, noarchive, nosnippet, noai, noimageai, nollms",
    },
  };
}

export default async function JobApplicationPage({ params }: Props) {
  const { slug } = await params;
  const job = await prisma.job.findUnique({
    where: { slug },
    select: { id: true, title: true, description: true, descriptionUrl: true, slug: true, published: true, archived: true, location: true, type: true, salary: true, customFields: true },
  });

  if (!job) notFound();

  const status = getJobStatus(job);

  const customFields = (job.customFields ?? []) as Array<{
    id: string; label: string; type: "text" | "textarea" | "select" | "file"; required: boolean;
  }>;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/70">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-950 text-xs font-bold text-white">SL</span>
            <span className="text-sm font-semibold text-slate-950">ScoutLane</span>
          </Link>
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" />
            All positions
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr]">
          <section className="space-y-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-950">
                  <Building className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">ScoutLane</p>
                  <p className="text-xs text-muted-foreground">AI-Powered Recruitment</p>
                </div>
              </div>

              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">{job.title}</h1>
                <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  {job.location && (
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="h-4 w-4" />
                      {job.location}
                    </span>
                  )}
                  {job.type && (
                    <span className="inline-flex items-center gap-1.5">
                      <Briefcase className="h-4 w-4" />
                      {job.type}
                    </span>
                  )}
                  {job.salary && (
                    <span className="inline-flex items-center gap-1.5">
                      <DollarSign className="h-4 w-4" />
                      {job.salary}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {status !== "active" ? (
              <div className="rounded-2xl border border-amber-300 bg-amber-50 p-6 text-amber-900">
                <h2 className="text-base font-semibold">
                  {status === "closed" ? "This position is no longer accepting applications." : "This position is not open for applications yet."}
                </h2>
                <p className="mt-1 text-sm">If you received this link recently, contact the hiring team for the latest status.</p>
              </div>
            ) : null}

            <div className="space-y-4">
              <h2 className="text-base font-semibold text-slate-900">About this role</h2>
              {job.descriptionUrl ? (
                <div className="space-y-3">
                  <a
                    href={job.descriptionUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border/70 bg-card px-4 py-2 text-sm font-medium text-slate-900 hover:bg-muted/30"
                  >
                    View full job description Gåù
                  </a>
                  {/\.pdf($|\?)/i.test(job.descriptionUrl) ? (
                    <iframe
                      src={job.descriptionUrl}
                      className="h-[600px] w-full rounded-lg border border-border/70"
                      title="Job description"
                    />
                  ) : null}
                </div>
              ) : job.description ? (
                <div
                  className="prose prose-sm max-w-none text-slate-600 leading-7"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(job.description) }}
                />
              ) : (
                <div className="prose prose-sm max-w-none text-slate-600 leading-7">
                  Job details will be added soon.
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-border/70 bg-muted/20 p-6 space-y-4">
              <h2 className="text-base font-semibold text-slate-900">About ScoutLane</h2>
              <p className="text-sm leading-7 text-slate-600">
                ScoutLane is an AI-powered recruitment platform that helps companies streamline their hiring process. From posting jobs with custom application forms to intelligent resume parsing and pipeline management, ScoutLane provides everything hiring teams need to find and evaluate top talent.
              </p>
            </div>
          </section>

          <aside className="lg:pt-0">
            <div className="lg:sticky lg:top-6">
              {status === "active" ? (
                <ApplicationForm jobSlug={slug} customFields={customFields} />
              ) : (
                <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
                  <h2 className="text-base font-semibold text-slate-900">Applications unavailable</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    This position is not currently accepting applications.
                  </p>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
