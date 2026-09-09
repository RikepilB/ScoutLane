import type { Metadata } from "next";
import { auth } from "@/lib/auth/auth";
import { LandingPage } from "@/components/public/LandingPage";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  description:
    "Resumes, role fit and hiring decisions in one place. Explore ScoutLane's recruiter and admin workspaces with sample data.",
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

  return (
    <LandingPage
      session={session ? { user: { email: session.user?.email ?? undefined } } : null}
    />
  );
}
