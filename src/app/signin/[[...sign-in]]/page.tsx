import Link from "next/link";
import { AnimatedBackground } from "@/components/public/AnimatedBackground";
import { RoleChooser } from "../_components/RoleChooser";
import { RoleSignInPanel } from "../_components/RoleSignInPanel";
import { parseWorkspaceRole } from "@/lib/auth/parse-workspace-role";

type Props = {
  searchParams: Promise<{
    redirect_url?: string;
    callbackUrl?: string;
    as?: string;
  }>;
};

export default async function SignInPage({ searchParams }: Props) {
  const params = await searchParams;
  const callbackUrl = params.redirect_url ?? params.callbackUrl ?? "/admin";
  const role = parseWorkspaceRole(params.as);

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
            {role === "recruiter"
              ? "Recruiter lane: parse, score, and move candidates without touching settings."
              : role === "admin"
                ? "Admin lane: templates, integrations, team, and the full hiring system."
                : "Pick Admin or Recruiter. Each workspace is a separate demo with sample data."}
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

          <div className="rounded-2xl border border-slate-700/60 bg-slate-900/60 p-6 backdrop-blur-sm">
            {role ? (
              <RoleSignInPanel role={role} callbackUrl={callbackUrl} />
            ) : (
              <RoleChooser callbackUrl={callbackUrl} />
            )}
          </div>

          <p className="text-center text-xs text-slate-600">
            <Link href="/" className="hover:text-slate-400">
              Back to home
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
