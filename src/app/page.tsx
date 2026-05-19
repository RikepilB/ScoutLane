import type { Metadata } from "next";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
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
    <CareersJobBoard
      jobs={jobs.map((j) => ({
        ...j,
        createdAt: j.createdAt.toISOString(),
      }))}
      count={count}
      session={session ? { user: { email: session.user?.email ?? undefined } } : null}
    />
  );
}
