import Link from "next/link";
import { ArrowRight, LogIn, ShieldCheck, Search, MapPin, Briefcase, Clock } from "lucide-react";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await auth();

  const jobs = await prisma.job.findMany({
    where: { published: true, archived: false },
    select: {
      slug: true,
      title: true,
      description: true,
      location: true,
      type: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/70">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-sm font-bold text-white">
              SL
            </span>
            <span className="text-base font-semibold tracking-tight text-slate-950">ScoutLane</span>
          </Link>

          <nav className="flex items-center gap-3">
            {session?.user ? (
              <Button asChild variant="outline" size="sm">
                <Link href="/admin">Dashboard</Link>
              </Button>
            ) : (
              <Button asChild size="sm">
                <Link href="/signin" className="inline-flex items-center gap-1.5">
                  <LogIn className="h-3.5 w-3.5" />
                  Sign in
                </Link>
              </Button>
            )}
          </nav>
        </div>
      </header>

      <section className="border-b border-border/70 bg-muted/30">
        <div className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
          <div className="max-w-2xl">
            <span className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700">
              AI-Powered Recruitment
            </span>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              Find your next role
            </h1>
            <p className="mt-3 text-base leading-7 text-slate-600">
              ScoutLane helps companies hire smarter. Browse open positions below — each role includes a direct application link and AI-enhanced resume processing.
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search jobs..."
              className="w-full rounded-xl border border-border/70 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-sky-500"
            />
          </div>
          <div className="flex gap-2 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{jobs.length}</span>
            {jobs.length === 1 ? "position" : "positions"} open
          </div>
        </div>

        <div className="mt-8 space-y-3">
          {jobs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-12 text-center text-sm text-muted-foreground">
              No open positions right now. Check back later.
            </div>
          ) : (
            jobs.map((job) => (
              <Link
                key={job.slug}
                href={`/careers/${job.slug}`}
                className="group block rounded-2xl border border-border/70 bg-card p-5 shadow-sm transition-all hover:border-sky-200 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg font-semibold text-slate-950 group-hover:text-sky-700 transition-colors">
                      {job.title}
                    </h2>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                      {job.location && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {job.location}
                        </span>
                      )}
                      {job.type && (
                        <span className="inline-flex items-center gap-1">
                          <Briefcase className="h-3.5 w-3.5" />
                          {job.type}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {new Date(job.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                    </div>
                    {job.description && (
                      <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">
                        {job.description}
                      </p>
                    )}
                  </div>
                  <div className="hidden shrink-0 sm:flex">
                    <span className="inline-flex items-center gap-1 rounded-lg border border-border/70 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors group-hover:border-sky-200 group-hover:bg-sky-50 group-hover:text-sky-700">
                      View role
                      <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
