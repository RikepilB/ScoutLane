import Link from "next/link";
import type { Metadata } from "next";
import { LogIn, Plus } from "lucide-react";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { Button } from "@/components/ui/button";
import { CareersJobBoard } from "@/components/public/CareersJobBoard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ScoutLane — Open positions",
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
    },
  },
};

export default async function Home() {
  const session = await auth();

  const jobs = await prisma.job.findMany({
    where: { published: true, archived: false },
    select: {
      id: true,
      title: true,
      slug: true,
      location: true,
      type: true,
      department: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const count = jobs.length;

  return (
    <div className="min-h-screen bg-[#f6f7fb]">
      <section
        className="pb-12 pt-4 sm:pb-16 sm:pt-6"
        style={{ background: "linear-gradient(135deg, #1150ff 0%, #0043ce 100%)" }}
      >
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
          <header className="mb-8 flex items-center justify-between sm:mb-12">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 text-sm font-bold text-white">
                SL
              </span>
              <span className="text-lg font-semibold tracking-tight text-white">ScoutLane</span>
            </Link>

            <nav className="flex items-center gap-3">
              {session?.user ? (
                <Button asChild size="sm" className="rounded-full bg-white text-slate-900 hover:bg-slate-100">
                  <Link href="/admin">Dashboard</Link>
                </Button>
              ) : (
                <Button asChild size="sm" className="rounded-full bg-white text-slate-900 hover:bg-slate-100">
                  <Link href="/signin" className="inline-flex items-center gap-1.5">
                    <LogIn className="h-3.5 w-3.5" />
                    Sign in
                  </Link>
                </Button>
              )}
            </nav>
          </header>

          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-3">
              <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white/90">
                AI-powered recruitment
              </span>
              <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
                Current job openings at ScoutLane
              </h1>
              <p className="text-base leading-7 text-white/75">
                Explore our open positions and find the role that matches your skills and ambitions.
              </p>
              <p className="text-sm font-medium text-white/60">
                Open positions · {count} {count === 1 ? "job" : "jobs"} available
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {session?.user ? (
                <>
                  <Button asChild className="rounded-full bg-white text-slate-900 hover:bg-slate-100">
                    <Link href="/admin">Dashboard</Link>
                  </Button>
                  <Button asChild className="rounded-full bg-[#2563eb] text-white hover:bg-[#1d4ed8]">
                    <Link href="/admin/jobs/new" className="inline-flex items-center gap-1.5">
                      <Plus className="h-4 w-4" />
                      Create job
                    </Link>
                  </Button>
                </>
              ) : (
                <Button asChild className="rounded-full bg-white text-slate-900 hover:bg-slate-100">
                  <Link href="/signin">Sign in</Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1200px] px-4 pb-12 sm:px-6">
        {count === 0 ? (
          <div className="mt-10 text-center">
            <p className="text-lg text-slate-500">No open positions at this time.</p>
            <p className="mt-2 text-sm text-slate-400">
              Check back later or sign in to create job listings.
            </p>
          </div>
        ) : (
          <CareersJobBoard
            jobs={jobs.map((j) => ({
              ...j,
              createdAt: j.createdAt.toISOString(),
            }))}
          />
        )}
      </div>
    </div>
  );
}
