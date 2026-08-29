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
    title: "Run the whole hiring system",
    body: "Templates, stages, integrations, team roles — sample data already loaded.",
  },
  recruiter: {
    kicker: "Recruiter workspace",
    title: "Review, score, and move the lane",
    body: "Parsed resumes, job-fit scores, and the Kanban pipeline for your jobs.",
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

      <DemoSignInButton role={role} callbackUrl={callbackUrl} className="w-full">
        {role === "admin" ? "Enter as Admin" : "Enter as Recruiter"}
      </DemoSignInButton>
      <p className="text-center text-xs text-slate-500">
        Signs in as {account.email} with seeded jobs and applicants.
      </p>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-slate-700/60" />
        <span className="text-xs text-slate-500">or use an invite</span>
        <div className="h-px flex-1 bg-slate-700/60" />
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
            headerTitle: "text-white",
            headerSubtitle: "text-slate-400",
            socialButtonsBlockButton:
              "border border-slate-600 bg-white text-slate-900 hover:bg-slate-100",
            formFieldLabel: "text-slate-300",
            formFieldInput: "rounded-xl border-slate-700/60 bg-slate-800/60 text-white",
            formButtonPrimary: "rounded-xl bg-sky-600 hover:bg-sky-500 text-sm font-medium",
            footerActionLink: "text-sky-400 hover:text-sky-300",
            identityPreviewEditButton: "text-sky-400",
          },
        }}
      />

      <p className="text-center text-xs text-slate-600">
        <Link href="/signin" className="hover:text-slate-400">
          Choose a different workspace
        </Link>
      </p>
    </div>
  );
}
