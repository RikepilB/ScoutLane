import type { Metadata } from "next";
import { auth } from "@/lib/auth/auth";
import { PublicNav } from "@/components/public/PublicNav";
import { PublicFooter } from "@/components/public/PublicFooter";
import { ResumeMatchForm } from "./resume-match-form";
import styles from "@/components/public/LandingPage.module.css";

export const metadata: Metadata = { title: "Resume match", description: "Compare your resume with a job and review the evidence before applying." };

export default async function ResumeMatchPage() {
  const session = await auth();

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <PublicNav
          session={session ? { user: { email: session.user?.email ?? undefined } } : null}
          tone="paper"
          showThemeToggle
        />
        <main className="mx-auto max-w-4xl py-10">
          <h1 className="text-3xl font-semibold">Resume match</h1>
          <p className="mb-8 mt-3 text-[var(--landing-muted)]">
            See what your resume demonstrates, what is missing, and what to clarify before
            applying.
          </p>
          <ResumeMatchForm />
        </main>
        <PublicFooter tone="paper" />
      </div>
    </div>
  );
}
