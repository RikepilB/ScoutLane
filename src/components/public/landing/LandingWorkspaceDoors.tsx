import { DemoSignInButton } from "@/app/signin/_components/DemoSignInButton";

export function LandingWorkspaceDoors() {
  return (
    <section className="mb-20 grid gap-4 lg:grid-cols-2">
      <article
        className="rounded-[24px] border border-[#1B2CC1]/40 p-7"
        style={{
          background:
            "radial-gradient(circle at 0% 0%, rgba(27,44,193,0.4), transparent 55%), rgba(9,21,64,0.72)",
        }}
      >
        <p
          className="text-[10px] font-medium uppercase tracking-[0.16em] text-[#7692FF]"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          Workspace A
        </p>
        <h2
          className="mt-2 text-[28px] font-medium tracking-[-0.03em] text-white"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Admin
        </h2>
        <p className="mt-3 max-w-md text-sm leading-6 text-[#f1f5f9]/65">
          Own the system: templates, custom forms, stages, team roles, email, and outbound
          integrations. Sample org is already populated.
        </p>
        <ul className="mt-5 space-y-1.5 text-sm text-[#ABD2FA]/80">
          <li>Job templates + snapshot copy</li>
          <li>Webhooks on stage transitions</li>
          <li>Organization and team settings</li>
        </ul>
        <DemoSignInButton role="admin" className="mt-7">
          Enter as Admin
        </DemoSignInButton>
      </article>

      <article
        className="rounded-[24px] border border-[#5ea7c5]/35 p-7"
        style={{
          background:
            "radial-gradient(circle at 100% 0%, rgba(94,167,197,0.22), transparent 50%), rgba(9,21,64,0.72)",
        }}
      >
        <p
          className="text-[10px] font-medium uppercase tracking-[0.16em] text-[#5ea7c5]"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          Workspace B
        </p>
        <h2
          className="mt-2 text-[28px] font-medium tracking-[-0.03em] text-white"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Recruiter
        </h2>
        <p className="mt-3 max-w-md text-sm leading-6 text-[#f1f5f9]/65">
          Run hiring: search parsed resumes, read job-fit scores, drag the Kanban, leave notes.
          Settings stay out of the way.
        </p>
        <ul className="mt-5 space-y-1.5 text-sm text-[#ABD2FA]/80">
          <li>Applicant list with AI fields</li>
          <li>Pipeline drag-and-drop</li>
          <li>Original resume + structured JSON</li>
        </ul>
        <DemoSignInButton role="recruiter" className="mt-7">
          Enter as Recruiter
        </DemoSignInButton>
      </article>
    </section>
  );
}
