import Link from "next/link";
import type { Metadata } from "next";
import { LayoutDashboard, LogIn } from "lucide-react";
import { auth } from "@/lib/auth/auth";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db/prisma";
import { CareersJobBoard, type CareersJob } from "@/components/public/CareersJobBoard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ScoutLane careers",
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

function inferDepartment(job: { title: string; type: string | null }): string {
  const title = job.title.toLowerCase();
  const type = job.type?.trim();

  if (/(data|machine learning|scientist|analytics|ai|ml)/i.test(job.title)) return "Data Science";
  if (/(frontend|backend|full[- ]?stack|software|engineer|platform|infrastructure)/i.test(job.title)) {
    return "Engineering";
  }
  if (/(recruit|talent|people|hr)/i.test(job.title)) return "People";
  if (/(marketing|growth|sales|account|customer|success|solutions)/i.test(job.title)) return "GTM";
  if (/(finance|procurement|accounting|operations)/i.test(job.title)) return "Operations";

  return type || "Open Roles";
}

export default async function Home() {
  const session = await auth();
  const jobs = await prisma.job.findMany({
    where: {
      published: true,
      archived: false,
    },
    orderBy: [{ title: "asc" }],
    select: {
      id: true,
      title: true,
      slug: true,
      location: true,
      type: true,
    },
  });

  const publicJobs: CareersJob[] = jobs.map((job) => ({
    ...job,
    department: inferDepartment(job),
  }));

  return (
    <div className="min-h-screen bg-[#f6f7fb] text-slate-950">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-blue-700 text-sm font-bold text-white">
              SL
            </span>
            <span className="text-base font-bold tracking-tight text-slate-950">ScoutLane</span>
          </Link>

          <nav className="flex items-center gap-3">
            {session?.user ? (
              <Button asChild size="sm" className="bg-blue-700 hover:bg-blue-800">
                <Link href="/admin" className="inline-flex items-center gap-1.5">
                  <LayoutDashboard className="h-3.5 w-3.5" />
                  Dashboard
                </Link>
              </Button>
            ) : (
              <Button asChild size="sm" className="bg-blue-700 hover:bg-blue-800">
                <Link href="/signin" className="inline-flex items-center gap-1.5">
                  <LogIn className="h-3.5 w-3.5" />
                  Sign in
                </Link>
              </Button>
            )}
          </nav>
        </div>
      </header>

      <section className="relative overflow-hidden bg-blue-700">
        <div className="absolute inset-0 opacity-95">
          <div className="absolute -left-24 top-10 h-56 w-[620px] rotate-[-24deg] rounded-full border-[72px] border-white/35" />
          <div className="absolute right-[-120px] top-[-90px] h-72 w-[620px] rotate-[-26deg] rounded-full border-[72px] border-white/85" />
        </div>
        <div className="relative mx-auto max-w-5xl px-6 py-14 sm:py-20">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-[0.24em] text-blue-100">
              Public application portal
            </p>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-6xl">
              Current job openings at ScoutLane
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-blue-50">
              Find active roles, open a dedicated job page, and apply through the role-specific application form.
            </p>
          </div>
        </div>
      </section>

      <CareersJobBoard jobs={publicJobs} />
    </div>
  );
}
