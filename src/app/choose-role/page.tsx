import { redirect } from "next/navigation";
import { auth, currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { AnimatedBackground } from "@/components/public/AnimatedBackground";
import { RoleSelector } from "./_components/RoleSelector";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Choose Your Role - ScoutLane",
  description: "Select Admin or Recruiter workspace",
};

export default async function ChooseRolePage() {
  const { userId } = await auth();

  // If not authenticated, redirect to signup
  if (!userId) {
    redirect("/signup");
  }

  // Check if user already has a role assigned
  const clerkUser = await currentUser();
  const email = clerkUser?.emailAddresses[0]?.emailAddress;

  if (email) {
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { role: true },
    });

    // If role already set, redirect to workspace
    if (existingUser?.role && existingUser.role !== "GUEST") {
      redirect(`/admin`);
    }
  }

  return (
    <div className="flex min-h-screen">
      <div className="relative hidden w-1/2 lg:block">
        <AnimatedBackground />
        <div className="absolute bottom-16 left-12 z-10 max-w-md">
          <Link
            href="/"
            className="block text-4xl font-black tracking-tight text-white drop-shadow-[0_2px_20px_rgba(0,0,0,0.3)]"
          >
            ScoutLane
          </Link>
          <p className="mt-3 text-lg leading-7 text-slate-300">
            Welcome! Pick your workspace to get started with AI-powered hiring.
          </p>
        </div>
      </div>

      <div className="flex w-full items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-6 py-10 lg:w-1/2">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center lg:hidden">
            <Link href="/" className="text-2xl font-bold tracking-tight text-white">
              ScoutLane
            </Link>
          </div>

          <RoleSelector />

          <p className="text-center text-xs text-slate-600">
            <Link href="/signin" className="hover:text-slate-400">
              Use a different account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
