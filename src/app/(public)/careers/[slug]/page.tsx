import { ApplicationForm } from "@/components/public/ApplicationForm";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { getJobStatus } from "@/lib/jobs";
import { formatLocations } from "@/lib/jobs/locations";
import { renderMarkdown } from "@/lib/utils/markdown";
import type { Prisma } from "@/generated/prisma/client";
import type { Metadata } from "next";
import Link from "next/link";
import { MapPin, Briefcase, DollarSign, Building } from "lucide-react";
import { PublicNav } from "@/components/public/PublicNav";

// Inline job runner work (resume parse + email sends via after()) can outlive
// the default serverless duration; give the apply action room to finish.
export const maxDuration = 60;

interface Props {
  params: Promise<{ slug: string }>;
}

function JobUnavailableState() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-900 font-body">
      <div className="text-center">
        <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-control bg-brand-royal font-display text-[28px] font-bold tracking-[-0.04em] text-paper">
          SL
        </div>
        <h1 className="mb-2 font-display text-[32px] font-medium tracking-[-0.02em] text-paper">
          Position not found
        </h1>
        <p className="mb-6 text-[14px] text-steel">
          This application link may have been removed, archived, or entered incorrectly.
        </p>
        <Button asChild className="rounded-control bg-brand-royal hover:bg-brand-slate">
          <Link href="/jobs">Browse jobs</Link>
        </Button>
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const job = await prisma.job.findUnique({
    where: { slug },
    select: { title: true, department: true, location: true },
  });
  const locations = formatLocations(job?.location, 2);
  const context = [job?.department, locations].filter(Boolean).join(" · ");
  return {
    title: job ? `${job.title}${context ? ` (${context})` : ""}` : "Position not found",
    description: job
      ? `Apply for ${job.title} at ScoutLane${locations ? ` — ${locations}` : ""}.`
      : "This position is no longer available.",
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
  const session = await auth();
  let job: Prisma.JobGetPayload<{
    select: {
      id: true;
      title: true;
      description: true;
      descriptionUrl: true;
      slug: true;
      published: true;
      archived: true;
      location: true;
      type: true;
      salary: true;
      customFields: true;
      whatYouWillDo: true;
      requirements: true;
      toolsAndSkills: true;
    };
  }> | null;
  try {
    job = await prisma.job.findUnique({
      where: { slug },
      select: { id: true, title: true, description: true, descriptionUrl: true, slug: true, published: true, archived: true, location: true, type: true, salary: true, customFields: true, whatYouWillDo: true, requirements: true, toolsAndSkills: true },
    });
  } catch (error) {
    console.error("[careers] failed to load public job:", error);
    return <JobUnavailableState />;
  }

  if (!job) {
    return <JobUnavailableState />;
  }

  const status = getJobStatus(job);

  const customFields = (job.customFields ?? []) as Array<{
    id: string; label: string; options?: string[]; type: "text" | "textarea" | "select"; required: boolean;
  }>;

  const requirementsList = (job.requirements ?? []) as string[];
  const skillsList = (job.toolsAndSkills ?? []) as string[];

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-paper font-body text-ink-900">
      {/* Header */}
      <header className="relative z-[1] border-b border-border-dark bg-ink-950">
        <div className="mx-auto max-w-6xl px-5 py-2 sm:px-6">
          <PublicNav
            session={session ? { user: { email: session.user?.email ?? undefined } } : null}
          />
        </div>
      </header>

      <div className="relative z-[1] mx-auto max-w-6xl px-5 py-10 sm:px-6 lg:py-12">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_420px] lg:items-start">
          {/* Main content */}
          <section className="space-y-6">
            <div className="shadow-overlay rounded-card border border-border-dark bg-ink-950 p-6 text-paper sm:p-8">
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-control bg-brand-royal">
                  <Building className="h-6 w-6 text-paper" />
                </div>
                <div>
                  <p className="text-sm font-medium text-paper">ScoutLane</p>
                  <p className="text-[13px] text-paper/55">Hiring demo · sample organization</p>
                </div>
              </div>

              <div>
                <h1 className="font-display text-[clamp(34px,5vw,56px)] font-medium leading-[0.98] tracking-[-0.03em] text-paper">
                  {job.title}
                </h1>
                <div className="mt-5 flex flex-wrap items-center gap-2.5 text-[13px] text-paper/75">
                  {job.location && (
                    <span className="inline-flex items-center gap-1.5 rounded-control border border-border-dark bg-ink-800 px-3 py-1.5">
                      <MapPin className="h-4 w-4" />
                      {formatLocations(job.location)}
                    </span>
                  )}
                  {job.type && (
                    <span className="inline-flex items-center gap-1.5 rounded-control border border-border-dark bg-ink-800 px-3 py-1.5">
                      <Briefcase className="h-4 w-4" />
                      {job.type}
                    </span>
                  )}
                  {job.salary && (
                    <span className="inline-flex items-center gap-1.5 rounded-control border border-border-dark bg-ink-800 px-3 py-1.5">
                      <DollarSign className="h-4 w-4" />
                      {job.salary}
                    </span>
                  )}
                </div>
              </div>
            </div>
            </div>

            {status !== "active" ? (
              <div className="rounded-card border border-warning/25 bg-warning-soft p-6 text-warning">
                <h2 className="text-base font-semibold">
                  {status === "closed" ? "This position is no longer accepting applications." : "This position is not open for applications yet."}
                </h2>
                <p className="mt-1 text-sm text-warning/80">If you received this link recently, contact the hiring team for the latest status.</p>
              </div>
            ) : null}

            {/* Structured description */}
            <div className="rounded-card border border-mist bg-surface p-6 shadow-raised sm:p-8">
              <h2 className="mb-6 font-display text-[24px] font-medium tracking-[-0.015em] text-ink-900">
                About this role
              </h2>

              {job.whatYouWillDo && (
                <div className="mb-8">
                  <h3 className="mb-3 text-[13px] font-semibold tracking-[0.02em] text-ink-900">
                    What you&apos;ll do
                  </h3>
                  <div
                    className="prose prose-sm max-w-none text-ink-700 leading-7"
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(job.whatYouWillDo) }}
                  />
                </div>
              )}

              {requirementsList.length > 0 && (
                <div className="mb-8">
                  <h3 className="mb-3 text-[13px] font-semibold tracking-[0.02em] text-ink-900">
                    Requirements
                  </h3>
                  <ul className="space-y-2">
                    {requirementsList.map((req, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-[14px] text-ink-700">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-royal" />
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {skillsList.length > 0 && (
                <div className="mb-8">
                  <h3 className="mb-3 text-[13px] font-semibold tracking-[0.02em] text-ink-900">
                    Tools & Skills
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {skillsList.map((skill, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center rounded-full border border-brand-royal/15 bg-brand-royal/10 px-3 py-1 text-[12px] font-medium text-brand-royal"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {job.descriptionUrl ? (
                <div className="space-y-3">
                  <a
                    href={job.descriptionUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-mist bg-surface px-4 py-2 text-[13px] font-medium text-ink-900 transition-all hover:bg-paper"
                  >
                    View full job description
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M7 17 17 7M7 7h10v10" /></svg>
                  </a>
                  {/\.pdf($|\?)/i.test(job.descriptionUrl) ? (
                    <iframe
                      src={job.descriptionUrl}
                      className="h-[600px] w-full rounded-lg border border-mist"
                      title="Job description"
                    />
                  ) : null}
                </div>
              ) : job.description ? (
                <div
                  className="prose prose-sm max-w-none text-ink-700 leading-7"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(job.description) }}
                />
              ) : null}
            </div>

          </section>

          {/* Sidebar */}
          <aside className="lg:pt-0">
            <div className="lg:sticky lg:top-6">
              {status === "active" ? (
                <ApplicationForm jobSlug={slug} customFields={customFields} />
              ) : (
                <div className="rounded-card border border-border-dark bg-ink-950 p-6">
                  <h2 className="font-display text-base font-semibold text-paper">
                    Applications unavailable
                  </h2>
                  <p className="mt-2 text-sm text-steel">
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
