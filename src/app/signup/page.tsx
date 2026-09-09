import Link from "next/link";
import { redirect } from "next/navigation";
import { AnimatedBackground } from "@/components/public/AnimatedBackground";
import { SignUp } from "@clerk/nextjs";
import { SignedInGate } from "../signin/_components/SignedInGate";
import { auth } from "@/lib/auth/auth";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Sign up",
  description: "Create your ScoutLane account",
};

export default async function SignUpPage() {
  // Authoritative, race-free check — see the matching comment in
  // src/app/signin/[[...sign-in]]/page.tsx.
  const session = await auth();
  if (session) {
    redirect("/choose-role");
  }

  return (
    <div className="flex min-h-screen">
      <div className="relative hidden w-1/2 lg:block">
        <AnimatedBackground />
        <div className="absolute bottom-16 left-12 z-10 max-w-md">
          <Link
            href="/"
            className="block text-4xl font-black tracking-tight text-paper drop-shadow-[0_2px_20px_rgba(0,0,0,0.3)]"
          >
            ScoutLane
          </Link>
          <p className="mt-3 text-lg leading-7 text-mist">
            AI-powered hiring. Admin sets up jobs and integrations. Recruiter reviews and scores applicants.
          </p>
        </div>
      </div>

      <div className="flex w-full items-center justify-center bg-ink-950 px-6 py-10 lg:w-1/2">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center lg:hidden">
            <Link href="/" className="text-2xl font-bold tracking-tight text-paper">
              ScoutLane
            </Link>
          </div>

          <div>
            <h1 className="text-2xl font-bold text-paper">Create your account</h1>
            <p className="mt-2 text-sm text-soft">
              You&apos;ll choose your role (Admin or Recruiter) after signup.
            </p>
          </div>

          <SignedInGate callbackUrl="/choose-role" continueLabel="Continue to role selection">
            <SignUp
              routing="path"
              path="/signup"
              signInUrl="/signin"
              fallbackRedirectUrl="/choose-role"
              appearance={{
                // See RoleSignInPanel.tsx for why this uses `variables` instead
                // of `elements` class overrides (the latter were silent no-ops
                // against this Clerk version's remote UI bundle).
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
                  logoBox: "hidden",
                  socialButtonsBlockButton:
                    "border border-ink-700 bg-surface text-ink-900 hover:bg-paper-2",
                },
              }}
            />
          </SignedInGate>

          <p className="text-center text-xs text-ink-700">
            Already have an account?{" "}
            <Link href="/signin" className="text-sky hover:text-sky">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
