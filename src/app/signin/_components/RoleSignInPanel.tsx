import Link from "next/link";
import { SignIn } from "@clerk/nextjs";
import { DEMO_ACCOUNTS, type DemoRole } from "@/lib/auth/roles";
import { DemoSignInButton } from "./DemoSignInButton";

const copy: Record<
  Exclude<DemoRole, "guest">,
  { kicker: string; title: string; body: string }
> = {
  admin: {
    kicker: "Admin workspace",
    title: "Sign in as Admin",
    body: "Use your Google account or work email to sign in with your own credentials.",
  },
  recruiter: {
    kicker: "Recruiter workspace",
    title: "Sign in as Recruiter",
    body: "Use your Google account or work email to sign in with your own credentials.",
  },
};

export function RoleSignInPanel({
  role,
  callbackUrl,
}: {
  role: Exclude<DemoRole, "guest">;
  callbackUrl: string;
}) {
  const account = DEMO_ACCOUNTS[role];
  const text = copy[role];

  return (
    <div className="space-y-6">
      <div>
        <p
          className="text-[10px] font-medium uppercase tracking-[0.16em] text-[#ABD2FA]"
          style={{ fontFamily: "var(--font-mono)" }}
          role="doc-subtitle"
        >
          {text.kicker}
        </p>
        <h1
          className="mt-2 text-[28px] font-medium tracking-[-0.03em] text-white"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {text.title}
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-400">{text.body}</p>
      </div>

      <SignIn
        routing="path"
        path="/signin"
        forceRedirectUrl={callbackUrl}
        fallbackRedirectUrl="/admin"
        appearance={{
          elements: {
            rootBox: "w-full",
            card: "bg-transparent shadow-none p-0",
            // ScoutLane's own logo already appears in the hero panel and mobile
            // header on this page — Clerk's default logo box is redundant here.
            // The "Secured by Clerk" trust footer is intentionally left as-is:
            // it's tied to the Clerk instance tier, not a themeable element.
            logoBox: "hidden",
            headerTitle: "text-white",
            headerSubtitle: "text-slate-400",
            socialButtonsBlockButton:
              "border border-slate-600 bg-white text-slate-900 hover:bg-slate-100",
            dividerLine: "bg-slate-700/60",
            dividerText: "text-slate-500",
            formFieldLabel: "text-slate-300",
            formFieldInput: "rounded-xl border-slate-700/60 bg-slate-800/60 text-white",
            formButtonPrimary: "rounded-xl bg-sky-600 hover:bg-sky-500 text-sm font-medium",
            footerActionLink: "text-sky-400 hover:text-sky-300",
            identityPreviewEditButton: "text-sky-400",
          },
        }}
      />

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-slate-700/60" />
        <span className="text-xs text-slate-500">or</span>
        <div className="h-px flex-1 bg-slate-700/60" />
      </div>

      <section aria-labelledby="demo-heading" className="rounded-lg border border-slate-700/40 bg-slate-900/30 p-4">
        <h2 id="demo-heading" className="text-xs font-semibold uppercase tracking-wider text-slate-300">
          Skip sign-in — try the demo
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Not your own account. Signs everyone into the same shared demo data — don&rsquo;t use
          this for real invites.
        </p>
        <DemoSignInButton
          role={role}
          callbackUrl={callbackUrl}
          className="mt-4 w-full"
          aria-describedby="demo-desc"
        >
          {role === "admin" ? "Try demo as Admin" : "Try demo as Recruiter"}
        </DemoSignInButton>
        <p id="demo-desc" className="mt-2 text-xs text-slate-600">
          Signs in as {account.email}. Pre-loaded with sample jobs and applicants.
        </p>
      </section>

      <p className="text-center text-xs text-slate-600">
        <Link href="/signin" className="hover:text-slate-400">
          Choose a different workspace
        </Link>
      </p>
    </div>
  );
}
