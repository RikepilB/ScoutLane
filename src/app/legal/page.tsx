import type { Metadata } from "next";
import { auth } from "@/lib/auth/auth";
import { PublicNav } from "@/components/public/PublicNav";
import { CareersFooter } from "@/components/public/CareersFooter";

export const metadata: Metadata = {
  title: "ScoutLane — Terms & Privacy",
  robots: { index: false, follow: false },
};

export default async function LegalPage() {
  const session = await auth();

  return (
    <div
      className="relative min-h-screen"
      style={{ background: "#0c1529", color: "#f1f5f9", fontFamily: "var(--font-body)" }}
    >
      <div className="relative z-[1] mx-auto max-w-[820px] px-7 pb-20 pt-6">
        <PublicNav
          session={session ? { user: { email: session.user?.email ?? undefined } } : null}
          className="mb-9"
        />

        <div className="space-y-2 pb-8">
          <h1
            className="text-[32px] font-medium tracking-[-0.02em] text-white"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Terms &amp; Privacy
          </h1>
          <p className="text-sm leading-6 text-white/50">
            ScoutLane is a demo application built to showcase an AI-assisted hiring workflow.
            The terms below describe how the demo itself is meant to be used — they are not a
            substitute for legal advice, and this page should be reviewed by counsel before the
            product handles real hiring data at scale.
          </p>
        </div>

        <section id="terms" className="scroll-mt-24 space-y-4 border-t border-white/10 py-10">
          <h2 className="text-xl font-semibold text-white">Terms of Service</h2>

          <div className="space-y-4 text-sm leading-6 text-white/70">
            <p>
              <strong className="text-white/90">1. What this is.</strong> ScoutLane is a
              demonstration hiring platform. The Admin and Recruiter workspaces are seeded with
              sample jobs and applicants so visitors can explore the product; they are not a
              production recruiting service and should not be used to process real candidate
              applications or make real hiring decisions.
            </p>
            <p>
              <strong className="text-white/90">2. Demo accounts.</strong> One-click &ldquo;Enter
              as Admin&rdquo; / &ldquo;Enter as Recruiter&rdquo; sign-in creates a session against
              a shared demo account. Do not enter real personal, financial, or otherwise sensitive
              information into any demo workspace — anything submitted may be visible to other
              people exploring the same demo data.
            </p>
            <p>
              <strong className="text-white/90">3. Public job applications.</strong> The public
              job board (<code className="rounded bg-white/10 px-1.5 py-0.5">/jobs</code> and{" "}
              <code className="rounded bg-white/10 px-1.5 py-0.5">/careers/*</code>) accepts real
              file uploads and resume text for demonstration purposes (AI parsing, scoring, and
              the fit-check tool). Submit only information you&rsquo;re comfortable being
              processed by an AI model and stored in a shared demo database — see the Privacy
              section below.
            </p>
            <p>
              <strong className="text-white/90">4. No warranty.</strong> ScoutLane is provided
              &ldquo;as is,&rdquo; without warranty of any kind. AI-generated output (parsed
              resumes, fit scores, drafted emails) may be inaccurate or incomplete and should
              never be the sole basis for a real hiring decision.
            </p>
            <p>
              <strong className="text-white/90">5. Acceptable use.</strong> Don&rsquo;t use the
              demo to upload malicious files, attempt to access another organization&rsquo;s data,
              or abuse the rate-limited public endpoints (job alerts, fit-check, application
              submission).
            </p>
          </div>
        </section>

        <section id="privacy" className="scroll-mt-24 space-y-4 border-t border-white/10 py-10">
          <h2 className="text-xl font-semibold text-white">Privacy Policy</h2>

          <div className="space-y-4 text-sm leading-6 text-white/70">
            <p>
              <strong className="text-white/90">What we collect.</strong> When you apply to a job
              or use the fit-check tool, ScoutLane stores the resume file you upload, any contact
              details and answers you submit on the application form, and the structured data an
              AI model extracts from your resume (name, work history, education, skills). When
              you sign in, Clerk (our authentication provider) issues a session and stores your
              account identity.
            </p>
            <p>
              <strong className="text-white/90">How it&rsquo;s used.</strong> Resume text is sent
              to a third-party LLM provider (via OpenRouter) to extract structured fields and
              compute a job-fit score. Application data is shown to the demo organization&rsquo;s
              Admin/Recruiter workspace and, if a stage integration is configured, forwarded to
              that integration&rsquo;s webhook endpoint.
            </p>
            <p>
              <strong className="text-white/90">Storage &amp; retention.</strong> Uploaded resume
              files and parsed data are stored in ScoutLane&rsquo;s database for as long as the
              applicant record exists. As this is a demo environment, data may be reset or deleted
              without notice — don&rsquo;t rely on it for anything you need to keep.
            </p>
            <p>
              <strong className="text-white/90">Third parties.</strong> Authentication: Clerk.
              Email delivery: Resend. AI inference: OpenRouter (and whichever underlying model
              provider it routes to). File storage: Google Cloud Storage. Hosting: Vercel.
              Database: Neon (PostgreSQL).
            </p>
            <p>
              <strong className="text-white/90">Your choices.</strong> Don&rsquo;t submit
              information you don&rsquo;t want processed by an AI model or visible in a shared
              demo. For questions about a specific submission, use the contact method the site
              owner has published alongside this demo.
            </p>
          </div>
        </section>

        <CareersFooter />
      </div>
    </div>
  );
}
