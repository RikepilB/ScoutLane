import Link from "next/link";
import type { Metadata } from "next";
import { LogIn, ShieldCheck } from "lucide-react";
import { auth } from "@/lib/auth/auth";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ScoutLane",
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
          <div className="max-w-2xl space-y-4">
            <span className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700">
              AI-Powered Recruitment
            </span>
            <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">ScoutLane hiring</h1>
            <p className="text-base leading-7 text-slate-600">
              Open roles are shared as direct links (for example{" "}
              <code className="rounded bg-white px-1.5 py-0.5 text-sm">/careers/your-role-slug</code>). There is no
              public job directory here by design.
            </p>
            <p className="text-base leading-7 text-slate-600">
              If you are applying, use the link you received from the recruiting team. If you are hiring, sign in to
              manage jobs, templates, applicants, and pipeline analytics.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Button asChild>
                <Link href="/signin">Recruiter sign in</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/admin">Go to dashboard</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-12">
        <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 text-emerald-600" />
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Privacy-first public pages</h2>
              <p className="mt-2 text-sm text-muted-foreground leading-6">
                Individual job pages are marked non-indexable and are intended to be accessed only via their direct URL.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
