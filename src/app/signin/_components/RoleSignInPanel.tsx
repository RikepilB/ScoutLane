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
          // Token-based theming — this Clerk version renders from a remote UI
          // bundle whose internal DOM doesn't reliably match the classic
          // `elements` class-override keys (confirmed live: headerTitle/card
          // overrides were silently no-ops, card stayed white). `variables`
          // are read by every internal component regardless of DOM shape.
          variables: {
            colorPrimary: "#1B2CC1",
            colorBackground: "#0f172a",
            colorForeground: "#f1f5f9",
            colorMutedForeground: "#94a3b8",
            colorInput: "#1e293b",
            colorInputForeground: "#f1f5f9",
            colorNeutral: "#ffffff",
            colorBorder: "#334155",
          },
          elements: {
            rootBox: "w-full",
            card: "border border-slate-700/60 shadow-none rounded-2xl",
            // ScoutLane's own logo already appears in the hero panel and mobile
            // header on this page — Clerk's default logo box is redundant here.
            // The "Secured by Clerk" trust footer is intentionally left as-is:
            // it's tied to the Clerk instance tier, not a themeable element.
            logoBox: "hidden",
            // Google's own button stays on its native white/light styling —
            // standard OAuth-button branding practice, not a theming miss.
            socialButtonsBlockButton:
              "border border-slate-600 bg-white text-slate-900 hover:bg-slate-100",
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
