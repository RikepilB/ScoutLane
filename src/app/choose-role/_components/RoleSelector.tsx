import { RoleSelectButton } from "./RoleSelectButton";

const doors = [
  {
    role: "ADMIN" as const,
    kicker: "Full control",
    title: "Admin Workspace",
    body: "Set up hiring: create jobs, manage templates, configure integrations, and manage your team.",
    items: [
      "Job creation & templates",
      "Webhooks & integrations",
      "Team role management",
      "Organization settings",
    ],
    selectLabel: "Choose Admin",
    accent: "var(--color-peri)",
  },
  {
    role: "RECRUITER" as const,
    kicker: "Day-to-day hiring",
    title: "Recruiter Workspace",
    body: "Review applicants: parse resumes, score fit, move candidates through the pipeline.",
    items: [
      "AI-parsed resumes",
      "Job-fit scoring",
      "Kanban pipeline",
      "CSV export",
    ],
    selectLabel: "Choose Recruiter",
    accent: "var(--color-cyan)",
  },
];

export function RoleSelector() {
  return (
    <div className="space-y-6">
      <div>
        <h1
          className="text-[28px] font-medium tracking-[-0.03em] text-paper"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Choose your workspace
        </h1>
        <p className="mt-2 text-sm leading-6 text-soft">
          AI-powered hiring in two modes. Pick one to start exploring right now.
        </p>
      </div>

      <div className="grid gap-4" role="list">
        {doors.map((door) => (
          <article
            key={door.role}
            role="listitem"
            className="border-t border-border-dark-strong py-5"
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
                  className="mt-1 text-xl font-medium text-paper"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {door.title}
                </h2>
              </div>
            </div>
            <p className="mt-2 text-sm leading-6 text-soft">{door.body}</p>
            <ul className="mt-3 space-y-1 text-xs text-text-inverse-muted" aria-label={`Features in ${door.title}`}>
              {door.items.map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span style={{ color: door.accent }}>→</span> {item}
                </li>
              ))}
            </ul>
            <div className="mt-5">
              <RoleSelectButton
                role={door.role}
                className="w-full"
                aria-label={`${door.selectLabel}: set up your workspace`}
              >
                {door.selectLabel}
              </RoleSelectButton>
            </div>
          </article>
        ))}
      </div>

    </div>
  );
}
