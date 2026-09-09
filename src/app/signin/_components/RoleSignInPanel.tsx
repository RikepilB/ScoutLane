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
    <div className="scoutlane-signin space-y-6">
      <div>
        <p
          className="text-[10px] font-medium uppercase tracking-[0.16em] text-sky"
          style={{ fontFamily: "var(--font-mono)" }}
          role="doc-subtitle"
        >
          {text.kicker}
        </p>
        <h1
          className="mt-2 text-[28px] font-medium tracking-[-0.03em] text-paper"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {text.title}
        </h1>
        <p className="mt-2 text-sm leading-6 text-soft">{text.body}</p>
      </div>

      <SignIn
        routing="path"
        path="/signin"
        forceRedirectUrl={callbackUrl}
        fallbackRedirectUrl="/admin"
        appearance={{
          // Explicit palette values mirror docs/DESIGN.md. This Clerk version renders from a remote UI
          // bundle whose internal DOM doesn't reliably match the classic
          // `elements` class-override keys (confirmed live: headerTitle/card
          // overrides were silently no-ops, card stayed white). `variables`
          // are read by every internal component regardless of DOM shape.
          variables: {
            colorPrimary: "#765a77",
            colorBackground: "#17151a",
            colorForeground: "#f8f8fa",
            colorMutedForeground: "#b9b4c1",
            colorInput: "#232129",
            colorInputForeground: "#f8f8fa",
            colorNeutral: "#f8f8fa",
            colorBorder: "#57525e",
          },
          elements: {
            rootBox: "w-full",
            card: "border border-ink-700/60 shadow-none rounded-2xl",
            // ScoutLane's own logo already appears in the hero panel and mobile
            // header on this page — Clerk's default logo box is redundant here.
            // The "Secured by Clerk" trust footer is intentionally left as-is:
            // it's tied to the Clerk instance tier, not a themeable element.
            logoBox: "hidden",
            // Google's own button stays on its native white/light styling —
            // standard OAuth-button branding practice, not a theming miss.
            socialButtonsBlockButton:
              "border border-ink-700 bg-surface text-ink-900 hover:bg-paper-2",
          },
        }}
      />

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-ink-700/60" />
        <span className="text-xs text-text-inverse-muted">or</span>
        <div className="h-px flex-1 bg-ink-700/60" />
      </div>

      <section aria-labelledby="demo-heading" className="rounded-lg border border-ink-700/40 bg-ink-900/30 p-4">
        <h2 id="demo-heading" className="text-xs font-semibold uppercase tracking-wider text-mist">
          Skip sign-in — try the demo
        </h2>
        <p className="mt-1 text-xs leading-5 text-text-inverse-muted">
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
        <p id="demo-desc" className="mt-2 text-xs leading-5 text-text-inverse-muted">
          Signs in as {account.email}. Pre-loaded with sample jobs and applicants.
        </p>
      </section>

      <p className="text-center text-xs text-text-inverse-muted">
        <Link href="/signin" className="inline-flex min-h-11 items-center hover:text-paper">
          Choose a different workspace
        </Link>
      </p>
    </div>
  );
}
