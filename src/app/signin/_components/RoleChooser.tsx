import Link from "next/link";
import { DemoSignInButton } from "./DemoSignInButton";

const doors = [
  {
    href: "/signin?as=admin",
    role: "admin" as const,
    kicker: "Full control",
    title: "Admin",
    body: "Templates, form builder, team roles, integrations, and every hiring lane.",
    items: ["Organization settings", "Webhooks & integrations", "Email templates"],
    enterLabel: "Enter as Admin",
    accent: "#1B2CC1",
  },
  {
    href: "/signin?as=recruiter",
    role: "recruiter" as const,
    kicker: "Day-to-day hiring",
    title: "Recruiter",
    body: "Jobs, parsed applicants, job-fit scores, and the Kanban pipeline.",
    items: ["My jobs", "Applicant review", "Stage moves"],
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
          Choose a workspace
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Two separate demos, both loaded with sample jobs and applicants.
        </p>
      </div>

      <div className="grid gap-4">
        {doors.map((door) => (
          <div
            key={door.role}
            className="rounded-2xl border border-white/[0.08] bg-[#091540]/70 p-5"
            style={{ boxShadow: `inset 0 1px 0 rgba(255,255,255,0.06), 0 0 0 1px ${door.accent}22` }}
          >
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
            <p className="mt-2 text-sm leading-6 text-slate-400">{door.body}</p>
            <ul className="mt-3 space-y-1 text-xs text-slate-500">
              {door.items.map((item) => (
                <li key={item}>· {item}</li>
              ))}
            </ul>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center">
              <DemoSignInButton role={door.role} callbackUrl={callbackUrl} className="w-full sm:w-auto">
                {door.enterLabel}
              </DemoSignInButton>
              <Link
                href={door.href}
                className="text-center text-xs text-slate-500 underline-offset-4 hover:text-slate-300 hover:underline sm:text-left"
              >
                Use an invite instead
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
