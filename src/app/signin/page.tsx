"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { AnimatedBackground } from "@/components/AnimatedBackground";

function SignInContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/admin";
  const [email, setEmail] = useState("admin@scoutlane.local");
  const [loading, setLoading] = useState(false);

  const handleDevLogin = async () => {
    setLoading(true);
    await signIn("dev", { email, redirectTo: callbackUrl });
  };

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
            AI-powered recruitment platform. Post jobs, review applicants, and manage your hiring pipeline from one workspace.
          </p>
        </div>
      </div>

      <div className="flex w-full items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-6 lg:w-1/2">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center lg:hidden">
            <Link href="/" className="text-2xl font-bold tracking-tight text-white">
              ScoutLane
            </Link>
            <p className="mt-1 text-sm text-slate-400">Sign in to your account</p>
          </div>

          <div className="rounded-2xl border border-slate-700/60 bg-slate-900/60 p-6 backdrop-blur-sm">
            <button
              onClick={() => signIn("google", { redirectTo: callbackUrl })}
              className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-600 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 transition hover:bg-slate-100"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Sign in with Google
            </button>

            <div className="relative mb-3">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-700/50" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-slate-900/60 px-2 text-slate-500">Dev Login</span>
              </div>
            </div>

            <div className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@scoutlane.local"
                className="flex-1 rounded-xl border border-slate-700/60 bg-slate-800/60 px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-sky-500"
              />
              <button
                onClick={handleDevLogin}
                disabled={loading || !email}
                className="rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-sky-500 disabled:opacity-50"
              >
                {loading ? "..." : "Enter"}
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Dev bypass — unknown emails become ADMIN for local testing; if your email matches a seed
              or database user (e.g. recruiter@scoutlane.local), sign-in uses that account&apos;s role.
            </p>
          </div>

          <p className="text-center text-xs text-slate-600">
            <Link href="/" className="hover:text-slate-400">Back to home</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense>
      <SignInContent />
    </Suspense>
  );
}
