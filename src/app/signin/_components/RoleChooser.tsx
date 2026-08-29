import Link from "next/link";
import { DemoSignInButton } from "./DemoSignInButton";

const doors = [
  {
    href: "/signin?as=admin",
    role: "admin" as const,
    kicker: "Full control",
    title: "Admin Workspace",
    body: "Set up hiring: create jobs, manage templates, configure integrations, and manage your team.",
    items: [
      "Job creation & templates",
      "Webhooks & integrations",
      "Team role management",
      "Organization settings",
    ],
    enterLabel: "Enter as Admin",
    accent: "#1B2CC1",
  },
  {
    href: "/signin?as=recruiter",
    role: "recruiter" as const,
    kicker: "Day-to-day hiring",
    title: "Recruiter Workspace",
    body: "Review applicants: parse resumes, score fit, move candidates through the pipeline.",
    items: [
      "AI-parsed resumes",
      "Job-fit scoring",
      "Kanban pipeline",
      "CSV export",
    ],
    enterLabel: "Enter as Recruiter",
    accent: "#5ea7c5",
  },
];

export function RoleChooser({ callbackUrl }: { callbackUrl: string }) {
  return (
    <div className="space-y-6">
      <div>
        <h1
          className="text-[28px] font-medium tracking-[-0.03em] text-white"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Choose your workspace
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          AI-powered hiring in two modes. Pick one to start exploring right now.
        </p>
      </div>

      <div className="grid gap-4" role="list">
        {doors.map((door) => (
          <article
            key={door.role}
            role="listitem"
            className="rounded-2xl border border-white/[0.08] bg-[#091540]/70 p-5 transition-colors hover:border-white/[0.12]"
            style={{ boxShadow: `inset 0 1px 0 rgba(255,255,255,0.06), 0 0 0 1px ${door.accent}22` }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p
                  className="text-[10px] font-medium uppercase tracking-[0.16em]"
                  style={{ fontFamily: "var(--font-mono)", color: door.accent }}
                >
                  {door.kicker}
                </p>
                <h2
                  className="mt-1 text-xl font-medium text-white"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {door.title}
                </h2>
              </div>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-400">{door.body}</p>
            <ul className="mt-3 space-y-1 text-xs text-slate-500" aria-label={`Features in ${door.title}`}>
              {door.items.map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span style={{ color: door.accent }}>→</span> {item}
                </li>
              ))}
            </ul>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              <DemoSignInButton
                role={door.role}
                callbackUrl={callbackUrl}
                className="w-full sm:w-auto"
                aria-label={`${door.enterLabel}: get instant access with sample data`}
              >
                {door.enterLabel}
              </DemoSignInButton>
              <Link
                href={door.href}
                className="inline-block text-center text-xs text-slate-500 underline-offset-4 transition-colors hover:text-slate-300 hover:underline sm:text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
                aria-label={`Sign in to ${door.title} with an invite`}
              >
                Use invite
              </Link>
            </div>
          </article>
        ))}
      </div>

      <div className="rounded-lg border border-slate-700/40 bg-slate-900/20 p-4">
        <p className="text-xs font-medium text-slate-300">💡 Not sure which one?</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          <strong>Admin:</strong> Full system setup, templates, integrations, team management.{" "}
          <strong>Recruiter:</strong> Applicant review, AI scoring, pipeline moves.
        </p>
      </div>
    </div>
  );
}
