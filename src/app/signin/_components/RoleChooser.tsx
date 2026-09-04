import Link from "next/link";

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
          Sign in with your own account, or explore a workspace pre-loaded with sample data.
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
            <Link
              href={`${door.href}&redirect_url=${encodeURIComponent(callbackUrl)}`}
              className="mt-5 inline-flex w-full items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 sm:w-auto"
              style={{
                background: `linear-gradient(180deg, ${door.accent}, ${door.accent}cc)`,
                boxShadow: `0 8px 20px ${door.accent}40`,
              }}
            >
              Continue as {door.title.replace(" Workspace", "")}
            </Link>
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
