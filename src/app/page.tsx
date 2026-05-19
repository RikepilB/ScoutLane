import Link from "next/link";
import type { Metadata } from "next";
import { LogIn } from "lucide-react";
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

  return (
    <div className="min-h-screen bg-[#f6f7fb]">
      <header className="border-b border-blue-200/40 bg-blue-700">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 text-sm font-bold text-white">
              SL
            </span>
            <span className="text-base font-semibold tracking-tight text-white">ScoutLane</span>
          </Link>

          <nav className="flex items-center gap-3">
            {session?.user ? (
              <Button asChild variant="outline" size="sm" className="border-white/30 text-white hover:bg-white/10 hover:text-white">
                <Link href="/admin">Dashboard</Link>
              </Button>
            ) : (
              <Button asChild size="sm" variant="outline" className="border-white/30 text-white hover:bg-white/10 hover:text-white">
                <Link href="/signin" className="inline-flex items-center gap-1.5">
                  <LogIn className="h-3.5 w-3.5" />
                  Sign in
                </Link>
              </Button>
            )}
          </nav>
        </div>
      </header>

      <section className="bg-blue-700 pb-12">
        <div className="mx-auto max-w-5xl px-6 pt-10 sm:pt-14">
          <div className="max-w-2xl space-y-3">
            <span className="inline-flex items-center rounded-full border border-blue-300/40 bg-white/10 px-3 py-1 text-xs font-medium text-blue-100">
              AI-Powered Recruitment
            </span>
            <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Current job openings at ScoutLane
            </h1>
            <p className="text-base leading-7 text-blue-100">
              Explore our open positions and find the role that matches your skills and ambitions.
            </p>
          </div>
        </div>
      </section>

      {jobs.length === 0 ? (
        <div className="mx-auto max-w-5xl px-6 py-20 text-center">
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
  );
}
