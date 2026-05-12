import Link from "next/link";
import { ArrowRight, ExternalLink, LogIn, ShieldCheck } from "lucide-react";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { Button } from "@/components/ui/button";

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
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.12),_transparent_45%),linear-gradient(180deg,#f8fafc_0%,#ffffff_100%)]">
      <div className="mx-auto w-full max-w-5xl px-6 py-12">
        <header className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-sm font-bold text-white">
              SL
            </span>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-950">ScoutLane</h1>
              <p className="text-sm text-muted-foreground">AI-powered recruitment platform</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {session?.user ? (
              <>
                <div className="hidden text-right sm:block">
                  <div className="text-sm font-medium text-slate-900">{session.user.email}</div>
                  <div className="text-xs text-muted-foreground">
                    Role: <span className="font-medium">{session.user.role ?? "—"}</span>
                  </div>
                </div>
                <Button asChild>
                  <Link href="/admin">Go to admin</Link>
                </Button>
              </>
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

        <section className="mb-10 rounded-[2rem] border border-border/70 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-8 text-white shadow-sm">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="space-y-3">
              <p className="text-sm uppercase tracking-[0.24em] text-sky-200/80">Welcome</p>
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Run hiring from one workspace
              </h2>
              <p className="max-w-2xl text-sm text-slate-300">
                Admins post jobs, share a public link, and review applicants. Candidates apply
                without an account. Use the page map below to jump anywhere.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {session?.user ? (
                <Button asChild variant="secondary">
                  <Link href="/admin/jobs">Manage jobs</Link>
                </Button>
              ) : (
                <Button asChild variant="secondary">
                  <Link href="/signin" className="inline-flex items-center gap-1">
                    <ShieldCheck className="h-4 w-4" />
                    Dev Login
                  </Link>
                </Button>
              )}
              {jobs[0] ? (
                <Button asChild>
                  <Link href={`/careers/${jobs[0].slug}`} className="inline-flex items-center gap-1">
                    See a public job
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              ) : null}
            </div>
          </div>
        </section>

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
    </main>
  );
}
