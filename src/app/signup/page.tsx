import Link from "next/link";
import { AnimatedBackground } from "@/components/public/AnimatedBackground";
import { SignUp } from "@clerk/nextjs";
import { SignedInGate } from "../signin/_components/SignedInGate";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Sign Up - ScoutLane",
  description: "Create your ScoutLane account",
};

export default function SignUpPage() {
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
                elements: {
                  rootBox: "w-full",
                  card: "bg-transparent shadow-none p-0",
                  // ScoutLane's own logo already appears in the hero panel/mobile
                  // header on this page. "Secured by Clerk" is left as-is — tied
                  // to the Clerk instance tier, not a themeable element.
                  logoBox: "hidden",
                  headerTitle: "text-white text-2xl",
                  headerSubtitle: "text-slate-400",
                  socialButtonsBlockButton:
                    "border border-slate-600 bg-white text-slate-900 hover:bg-slate-100",
                  dividerLine: "bg-slate-700/60",
                  dividerText: "text-slate-500",
                  formFieldLabel: "text-slate-300",
                  formFieldInput: "rounded-xl border-slate-700/60 bg-slate-800/60 text-white",
                  formButtonPrimary: "rounded-xl bg-sky-600 hover:bg-sky-500 text-sm font-medium",
                  footerActionLink: "text-sky-400 hover:text-sky-300",
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
