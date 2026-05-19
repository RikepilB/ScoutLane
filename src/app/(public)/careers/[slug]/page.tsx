import { ApplicationForm } from "@/components/public/ApplicationForm";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { getJobStatus } from "@/lib/jobs";
import { renderMarkdown } from "@/lib/utils/markdown";
import type { Prisma } from "@/generated/prisma/client";
import type { Metadata } from "next";
import Link from "next/link";
import { MapPin, Briefcase, DollarSign, ArrowLeft, Building, LogIn } from "lucide-react";

interface Props {
  params: Promise<{ slug: string }>;
}

function JobUnavailableState() {
  return (
    <div className="flex min-h-screen items-center justify-center" style={{ background: "#0B1437", fontFamily: "var(--font-body)" }}>
      <div className="text-center">
        <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-[18px] text-white shadow-[0_12px_30px_rgba(43,75,255,0.45),inset_0_1px_0_rgba(255,255,255,0.16)]"
          style={{ background: "linear-gradient(135deg, #2B4BFF, #1A2EFF)", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "28px", letterSpacing: "-0.04em" }}>
          SL
        </div>
        <h1 className="mb-2 text-[32px] font-medium tracking-[-0.02em] text-[#F9FAFB]"
          style={{ fontFamily: "var(--font-display)" }}>
          Position not found
        </h1>
        <p className="mb-6 text-[14px] text-[#6B7280]">
          This application link may have been removed, archived, or entered incorrectly.
        </p>
        <Button asChild className="rounded-full bg-[#2B4BFF] hover:bg-[#1A2EFF]">
          <Link href="/">Return home</Link>
        </Button>
      </div>
    </div>
  );
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
    id: string; label: string; type: "text" | "textarea" | "select" | "file"; required: boolean;
  }>;

  const requirementsList = (job.requirements ?? []) as string[];
  const skillsList = (job.toolsAndSkills ?? []) as string[];

  return (
    <div className="min-h-screen" style={{ background: "#0B1437", color: "#F9FAFB", fontFamily: "var(--font-body)" }}>
      {/* Background ambience */}
      <div className="pointer-events-none fixed inset-0 z-0 opacity-35"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)",
          backgroundSize: "32px 32px",
        }}
      />
      <div className="pointer-events-none fixed z-0"
        style={{
          top: "-200px", right: "-100px", width: "600px", height: "600px",
          background: "radial-gradient(circle, rgba(43,75,255,0.25), rgba(43,75,255,0) 70%)",
          filter: "blur(40px)",
        }}
      />

      {/* Header */}
      <header className="relative z-[1] border-b border-white/[0.08] bg-[#0B1437]">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold text-white"
              style={{
                background: "linear-gradient(135deg, #2B4BFF, #1A2EFF)",
                fontFamily: "var(--font-display)",
                letterSpacing: "-0.04em",
                boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.12)",
              }}>
              SL
            </span>
            <span className="text-[15px] font-semibold tracking-[-0.01em] text-[#F9FAFB]"
              style={{ fontFamily: "var(--font-display)" }}>
              ScoutLane
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#A3B0FF] transition-colors hover:text-white"
              style={{ fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              <ArrowLeft className="h-3.5 w-3.5" />
              All positions
            </Link>
            {session?.user ? (
              <Button asChild size="sm" className="rounded-full border border-white/[0.12] bg-white/[0.06] text-white hover:bg-white/[0.10] hover:text-white">
                <Link href="/admin">Dashboard</Link>
              </Button>
            ) : (
              <Button asChild size="sm" className="rounded-full bg-[#2B4BFF] hover:bg-[#1A2EFF]">
                <Link href="/signin" className="inline-flex items-center gap-1.5">
                  <LogIn className="h-3.5 w-3.5" />
                  Sign in
                </Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="relative z-[1] mx-auto max-w-5xl px-6 py-10">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr]">
          {/* Main content */}
          <section className="space-y-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl"
                  style={{ background: "linear-gradient(135deg, #2B4BFF, #1A2EFF)", boxShadow: "0 8px 20px rgba(43,75,255,0.35), inset 0 1px 0 rgba(255,255,255,0.12)" }}>
                  <Building className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#F9FAFB]">ScoutLane</p>
                  <p className="text-[11px] uppercase tracking-[0.12em] text-[#6B7280]"
                    style={{ fontFamily: "var(--font-mono)" }}>
                    AI-Powered Recruitment
                  </p>
                </div>
              </div>

              <div>
                <h1 className="text-[clamp(28px,4vw,40px)] font-medium leading-[1] tracking-[-0.03em] text-[#F9FAFB]"
                  style={{ fontFamily: "var(--font-display)" }}>
                  {job.title}
                </h1>
                <div className="mt-4 flex flex-wrap items-center gap-4 text-[13px] text-[#6B7280]"
                  style={{ fontFamily: "var(--font-mono)" }}>
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
              <div className="rounded-2xl border border-[rgba(217,119,6,0.25)] bg-[rgba(217,119,6,0.08)] p-6 text-[#D97706]">
                <h2 className="text-base font-semibold">
                  {status === "closed" ? "This position is no longer accepting applications." : "This position is not open for applications yet."}
                </h2>
                <p className="mt-1 text-sm text-[#D97706]/80">If you received this link recently, contact the hiring team for the latest status.</p>
              </div>
            ) : null}

            {/* Structured description */}
            <div className="rounded-[24px] border border-white/[0.04] bg-[#F9FAFB] p-8 shadow-[0_20px_60px_rgba(0,0,0,0.4)]"
              style={{ color: "#0B1437" }}>
              <h2 className="mb-6 text-[24px] font-medium tracking-[-0.015em] text-[#0B1437]"
                style={{ fontFamily: "var(--font-display)" }}>
                About this role
              </h2>

              {job.whatYouWillDo && (
                <div className="mb-8">
                  <h3 className="mb-3 text-[11px] font-medium uppercase tracking-[0.16em] text-[#473459]"
                    style={{ fontFamily: "var(--font-mono)" }}>
                    What you&apos;ll do
                  </h3>
                  <div
                    className="prose prose-sm max-w-none text-[#374151] leading-7"
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(job.whatYouWillDo) }}
                  />
                </div>
              )}

              {requirementsList.length > 0 && (
                <div className="mb-8">
                  <h3 className="mb-3 text-[11px] font-medium uppercase tracking-[0.16em] text-[#473459]"
                    style={{ fontFamily: "var(--font-mono)" }}>
                    Requirements
                  </h3>
                  <ul className="space-y-2">
                    {requirementsList.map((req, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-[14px] text-[#374151]">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#2B4BFF]" />
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {skillsList.length > 0 && (
                <div className="mb-8">
                  <h3 className="mb-3 text-[11px] font-medium uppercase tracking-[0.16em] text-[#473459]"
                    style={{ fontFamily: "var(--font-mono)" }}>
                    Tools & Skills
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {skillsList.map((skill, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center rounded-full border border-[rgba(43,75,255,0.15)] bg-[rgba(43,75,255,0.08)] px-3 py-1 text-[12px] font-medium text-[#2B4BFF]"
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
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#E5E7EB] bg-white px-4 py-2 text-[13px] font-medium text-[#0B1437] transition-all hover:bg-[#F9FAFB]"
                  >
                    View full job description
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M7 17 17 7M7 7h10v10" /></svg>
                  </a>
                  {/\.pdf($|\?)/i.test(job.descriptionUrl) ? (
                    <iframe
                      src={job.descriptionUrl}
                      className="h-[600px] w-full rounded-lg border border-[#E5E7EB]"
                      title="Job description"
                    />
                  ) : null}
                </div>
              ) : job.description ? (
                <div
                  className="prose prose-sm max-w-none text-[#374151] leading-7"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(job.description) }}
                />
              ) : null}
            </div>

            {/* About ScoutLane */}
            <div className="rounded-2xl border border-[#2B4BFF]/10 bg-[#0B1437] p-8"
              style={{
                background: "radial-gradient(circle at 80% 20%, rgba(43,75,255,0.08), transparent 50%), #0B1437",
              }}>
              <h2 className="mb-3 text-[20px] font-medium tracking-[-0.015em] text-[#F9FAFB]"
                style={{ fontFamily: "var(--font-display)" }}>
                About ScoutLane
              </h2>
              <p className="text-[14px] leading-7 text-[#6B7280]">
                ScoutLane is an AI-powered recruitment platform that helps companies streamline their hiring process. From posting jobs with custom application forms to intelligent resume parsing and pipeline management, ScoutLane provides everything hiring teams need to find and evaluate top talent.
              </p>
            </div>
          </section>

          {/* Sidebar */}
          <aside className="lg:pt-0">
            <div className="lg:sticky lg:top-6">
              {status === "active" ? (
                <ApplicationForm jobSlug={slug} customFields={customFields} />
              ) : (
                <div className="rounded-2xl border border-white/[0.08] bg-[#0F1B4D] p-6">
                  <h2 className="text-base font-semibold text-[#F9FAFB]"
                    style={{ fontFamily: "var(--font-display)" }}>
                    Applications unavailable
                  </h2>
                  <p className="mt-2 text-sm text-[#6B7280]">
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
