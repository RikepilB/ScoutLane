import Link from "next/link";
import { ArrowRight, ExternalLink, LogIn, ShieldCheck, Briefcase, Users, BarChart3 } from "lucide-react";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { Button } from "@/components/ui/button";
import { VideoHero } from "@/components/VideoHero";

export const dynamic = "force-dynamic";

type Access = "Public" | "ADMIN" | "Any auth";

interface PageLink {
  href: string;
  label: string;
  desc: string;
  access: Access;
}

const accessStyles: Record<Access, string> = {
  Public: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  ADMIN: "bg-violet-50 text-violet-700 ring-violet-200",
  "Any auth": "bg-sky-50 text-sky-700 ring-sky-200",
};

export default async function Home() {
  const session = await auth();
  const jobs = await prisma.job.findMany({
    where: { published: true, archived: false },
    select: { slug: true, title: true },
    orderBy: { createdAt: "desc" },
    take: 4,
  });

  const links: PageLink[] = [
    { href: "/", label: "Home", desc: "This page — entry, login, and a map of every route", access: "Public" },
    { href: "/signin", label: "Sign In", desc: "Custom sign-in page (Google + Dev Login bypass)", access: "Public" },
    { href: "/api/health", label: "Health check", desc: "JSON health endpoint", access: "Public" },
    { href: "/admin", label: "Admin dashboard", desc: "Stats + quick stats: jobs, applicants", access: "ADMIN" },
    { href: "/admin/jobs", label: "Jobs list", desc: "Filter & manage every job", access: "ADMIN" },
    { href: "/admin/jobs/new", label: "Create job", desc: "Form: title, description, location, type, salary", access: "ADMIN" },
    { href: "/access-denied", label: "Access denied", desc: "Shown to non-admin authenticated users", access: "Any auth" },
  ];

  return (
    <>
      <VideoHero>
        <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-6">
          <header className="flex items-center justify-between pt-6">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-sm font-bold text-white backdrop-blur-sm">
                SL
              </span>
              <span className="text-lg font-semibold tracking-tight text-white">ScoutLane</span>
            </div>

            <div className="flex items-center gap-2">
              {session?.user ? (
                <Button asChild variant="secondary">
                  <Link href="/admin">Go to admin</Link>
                </Button>
              ) : (
                <Button asChild>
                  <Link href="/signin" className="inline-flex items-center gap-1">
                    <LogIn className="h-4 w-4" />
                    Sign in
                  </Link>
                </Button>
              )}
            </div>
          </header>

          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <h1 className="max-w-4xl text-5xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl leading-[0.95] drop-shadow-[0_4px_40px_rgba(0,0,0,0.3)]">
              AI-Powered
              <br />
              <span className="bg-gradient-to-r from-sky-200 via-white to-sky-100 bg-clip-text text-transparent">
                Recruitment Platform
              </span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300 drop-shadow-[0_2px_20px_rgba(0,0,0,0.2)]">
              Post jobs, generate custom application forms, parse resumes with AI, and move candidates through a configurable pipeline — all from one workspace.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              {session?.user ? (
                <Button asChild size="lg">
                  <Link href="/admin/jobs" className="inline-flex items-center gap-2">
                    <Briefcase className="h-5 w-5" />
                    Manage jobs
                  </Link>
                </Button>
              ) : (
                <Button asChild size="lg">
                  <Link href="/signin" className="inline-flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5" />
                    Get started
                  </Link>
                </Button>
              )}
              {jobs[0] ? (
                <Button asChild variant="secondary" size="lg">
                  <Link href={`/careers/${jobs[0].slug}`} className="inline-flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    See a public job
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </VideoHero>

      <section className="border-b border-border/70 bg-muted/20">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-6 py-16 sm:grid-cols-3">
          {[
            { icon: Briefcase, title: "Job management", desc: "Create jobs with custom forms, templates, and pipeline stages" },
            { icon: BarChart3, title: "AI analytics", desc: "Resume parsing with Gemini, charts, and applicant insights" },
            { icon: Users, title: "Pipeline", desc: "Drag-and-drop Kanban board, stage transitions, and admin notes" },
          ].map((feature) => (
            <div key={feature.title} className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
              <feature.icon className="h-8 w-8 text-sky-600" />
              <h3 className="mt-4 text-base font-semibold text-slate-900">{feature.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="mx-auto w-full max-w-5xl px-6 py-12">
        <section className="mb-10">
          <h3 className="mb-3 text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
            Page map
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="group flex items-start justify-between gap-4 rounded-2xl border border-border/70 bg-card p-4 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-950">{link.label}</span>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset ${accessStyles[link.access]}`}
                    >
                      {link.access}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{link.desc}</p>
                  <code className="mt-1 block truncate text-[11px] text-slate-500">
                    {link.href}
                  </code>
                </div>
                <ArrowRight className="mt-1 h-4 w-4 flex-shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-slate-950" />
              </Link>
            ))}
          </div>
        </section>

        {jobs.length ? (
          <section>
            <h3 className="mb-3 text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
              Active jobs ({jobs.length})
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {jobs.map((job) => (
                <Link
                  key={job.slug}
                  href={`/careers/${job.slug}`}
                  className="group flex items-center justify-between rounded-2xl border border-border/70 bg-card p-4 shadow-sm transition-colors hover:border-sky-300 hover:bg-sky-50/40"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-slate-950">{job.title}</div>
                    <code className="mt-0.5 block truncate text-[11px] text-slate-500">
                      /careers/{job.slug}
                    </code>
                  </div>
                  <ExternalLink className="h-4 w-4 flex-shrink-0 text-muted-foreground transition-transform group-hover:text-sky-700" />
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </>
  );
}
