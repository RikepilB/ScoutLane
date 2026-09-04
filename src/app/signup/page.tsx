import Link from "next/link";
import { redirect } from "next/navigation";
import { AnimatedBackground } from "@/components/public/AnimatedBackground";
import { SignUp } from "@clerk/nextjs";
import { SignedInGate } from "../signin/_components/SignedInGate";
import { auth } from "@/lib/auth/auth";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Sign Up - ScoutLane",
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
            className="block text-4xl font-black tracking-tight text-white drop-shadow-[0_2px_20px_rgba(0,0,0,0.3)]"
          >
            ScoutLane
          </Link>
          <p className="mt-3 text-lg leading-7 text-slate-300">
            AI-powered hiring. Admin sets up jobs and integrations. Recruiter reviews and scores applicants.
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

          <div>
            <h1 className="text-2xl font-bold text-white">Create your account</h1>
            <p className="mt-2 text-sm text-slate-400">
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
                  logoBox: "hidden",
                  socialButtonsBlockButton:
                    "border border-slate-600 bg-white text-slate-900 hover:bg-slate-100",
                },
              }}
            />
          </SignedInGate>

          <p className="text-center text-xs text-slate-600">
            Already have an account?{" "}
            <Link href="/signin" className="text-sky-400 hover:text-sky-300">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
