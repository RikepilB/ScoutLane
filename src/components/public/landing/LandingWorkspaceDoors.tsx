import { DemoSignInButton } from "@/app/signin/_components/DemoSignInButton";

/**
 * The two entry points are the one place the page still uses panels — they
 * are genuine doors, so they get presence: lane-tinted depth, a light-catching
 * top rim instead of a flat border, and a soft glow in their own colour.
 */
export function LandingWorkspaceDoors() {
  return (
    <section id="demo" className="mb-24">
      <div className="mb-8 max-w-2xl">
        <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.18em] text-cyan">
          Pick a door
        </p>
        <h2 className="font-display text-display font-medium text-paper">
          Two workspaces, one demo
        </h2>
        <p className="mt-3 text-[15px] leading-6 text-paper/65">
          The same hiring pipeline from two sides. Both entries load a shared
          sample organization — no account needed.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <article
          className="shadow-door-royal relative overflow-hidden rounded-[24px] border border-border-dark p-7"
          style={{
            background:
              "radial-gradient(circle at 0% 0%, rgba(27,44,193,0.48), transparent 58%), radial-gradient(circle at 100% 110%, rgba(71,52,89,0.35), transparent 52%), rgba(9,21,64,0.78)",
          }}
        >
          <div
            aria-hidden
            className="absolute inset-x-0 top-0 h-px"
            style={{
              background:
                "linear-gradient(90deg, transparent 6%, rgba(118,146,255,0.55) 50%, transparent 94%)",
            }}
          />
          <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-peri/90">
            Admin workspace
          </p>
          <h3 className="mt-2 font-display text-[28px] font-medium tracking-[-0.02em] text-paper">
            Admin
          </h3>
          <p className="mt-3 max-w-md text-sm leading-6 text-paper/65">
            Own the system: templates, custom forms, stages, team roles, email, and outbound
            integrations. Sample org is already populated.
          </p>
          <ul className="mt-5 space-y-1.5 text-sm text-sky/85">
            <li>Job templates + snapshot copy</li>
            <li>Webhooks on stage transitions</li>
            <li>Organization and team settings</li>
          </ul>
          <DemoSignInButton role="admin" className="mt-7">
            Enter as Admin
          </DemoSignInButton>
        </article>

        <article
          className="shadow-door-cyan relative overflow-hidden rounded-[24px] border border-border-dark p-7"
          style={{
            background:
              "radial-gradient(circle at 100% 0%, rgba(94,167,197,0.3), transparent 55%), radial-gradient(circle at 0% 110%, rgba(71,52,89,0.3), transparent 52%), rgba(9,21,64,0.78)",
          }}
        >
          <div
            aria-hidden
            className="absolute inset-x-0 top-0 h-px"
            style={{
              background:
                "linear-gradient(90deg, transparent 6%, rgba(171,210,250,0.45) 50%, transparent 94%)",
            }}
          />
          <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-cyan">
            Recruiter workspace
          </p>
          <h3 className="mt-2 font-display text-[28px] font-medium tracking-[-0.02em] text-paper">
            Recruiter
          </h3>
          <p className="mt-3 max-w-md text-sm leading-6 text-paper/65">
            Run hiring: search parsed resumes, read job-fit scores, drag the Kanban, leave notes.
            Settings stay out of the way.
          </p>
          <ul className="mt-5 space-y-1.5 text-sm text-sky/85">
            <li>Applicant list with AI fields</li>
            <li>Pipeline drag-and-drop</li>
            <li>Original resume + structured JSON</li>
          </ul>
          <DemoSignInButton role="recruiter" className="mt-7">
            Enter as Recruiter
          </DemoSignInButton>
        </article>
      </div>
    </section>
  );
}
