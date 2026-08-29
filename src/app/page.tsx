import type { Metadata } from "next";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { LandingPage } from "@/components/public/LandingPage";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ScoutLane — AI-powered recruitment",
  description:
    "AI-assisted applicant tracking for recruiting teams. Browse jobs, try admin and recruiter demos with sample data.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    noarchive: true,
    nosnippet: true,
  },
};

export default async function Home() {
  const session = await auth();

  const [jobs, applicants, templates] = await Promise.all([
    prisma.job.count({ where: { published: true, archived: false } }),
    prisma.applicant.count(),
    prisma.jobTemplate.count(),
  ]);

  return (
    <LandingPage
      stats={{ jobs, applicants, templates }}
      session={session ? { user: { email: session.user?.email ?? undefined } } : null}
    />
  );
}
