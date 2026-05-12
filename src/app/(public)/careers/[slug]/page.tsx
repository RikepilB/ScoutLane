import { ApplicationForm } from "@/components/public/ApplicationForm";
import { prisma } from "@/lib/db/prisma";
import { getJobStatus } from "@/lib/jobs";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

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
      googleBot: {
        index: false,
        follow: false,
        noimageindex: true,
        "max-snippet": 0,
      },
    },
  };
}

export default async function JobApplicationPage({ params }: Props) {
  const { slug } = await params;
  const job = await prisma.job.findUnique({
    where: { slug },
  });

  if (!job) {
    notFound();
  }

  const status = getJobStatus(job);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.16),_transparent_38%),linear-gradient(180deg,#f8fafc_0%,#ffffff_100%)]">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-6 py-12 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-6">
          <div className="space-y-4">
            <span className="inline-flex rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-medium uppercase tracking-[0.22em] text-sky-700">
              Direct application link
            </span>
            <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              {job.title}
            </h1>
            <p className="max-w-3xl whitespace-pre-wrap text-base leading-7 text-slate-600">
              {job.description || "Job details will be added soon."}
            </p>
          </div>

          {status !== "active" ? (
            <div className="rounded-3xl border border-amber-300 bg-amber-50 p-6 text-amber-900">
              <h2 className="text-lg font-semibold">
                {status === "closed"
                  ? "This position is no longer accepting applications."
                  : "This position is not open for applications yet."}
              </h2>
              <p className="mt-2 text-sm">
                If you received this link recently, contact the hiring team for the latest
                status.
              </p>
            </div>
          ) : null}
        </section>

        <div className="lg:pt-10">
          {status === "active" ? (
            <ApplicationForm jobSlug={slug} />
          ) : (
            <div className="rounded-3xl border border-border/70 bg-white p-8 shadow-sm">
              <h2 className="text-xl font-semibold tracking-tight">Applications unavailable</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                This job link stays private and non-indexable, but submissions are currently
                disabled.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
