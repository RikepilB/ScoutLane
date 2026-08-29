interface CareersJobAlertSectionProps {
  alertEmail: string;
  setAlertEmail: (value: string) => void;
  alertStatus: "idle" | "submitting" | "done" | "error";
  onSubmit: (e: React.FormEvent) => void;
}

export function CareersJobAlertSection({
  alertEmail,
  setAlertEmail,
  alertStatus,
  onSubmit,
}: CareersJobAlertSectionProps) {
  return (
    <section className="animate-fade-up animate-fade-up-delay-3 relative mt-7 rounded-[24px] p-px shadow-[0_20px_50px_rgba(118,146,255,0.18)]"
      style={{ background: "linear-gradient(135deg, #7692FF, #5ea7c5, #ABD2FA)" }}>
      <div className="relative grid grid-cols-[auto_1fr_auto] items-center gap-7 overflow-hidden rounded-[23px] p-10 max-sm:grid-cols-1 max-sm:gap-4 max-sm:p-7"
        style={{
          background: "radial-gradient(circle at 80% 20%, rgba(118,146,255,0.18), transparent 50%), linear-gradient(135deg, #091540, #0c1529)",
        }}>
        <div className="pointer-events-none absolute -bottom-10 -right-10 h-[200px] w-[200px]"
          style={{ background: "radial-gradient(circle, rgba(94,167,197,0.25), transparent 70%)" }} />

        <div className="relative z-[1] flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-[18px] text-white shadow-[0_12px_30px_rgba(27,44,193,0.45),inset_0_1px_0_rgba(255,255,255,0.16)]"
          style={{ background: "linear-gradient(135deg, #1B2CC1, #3D518C)" }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9z" />
            <path d="M10.3 21a1.9 1.9 0 0 0 3.4 0" />
          </svg>
        </div>

        <div className="relative z-[1]">
          <h3 className="mb-1.5 text-[26px] tracking-[-0.015em]" style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}>
            Create a job alert
          </h3>
          <p className="max-w-[460px] text-[14.5px] leading-[1.5] text-[#f1f5f9]/65">
            Get notified the moment a role matching your skills opens up. No spam, no third-party sharing.
          </p>
        </div>

        {alertStatus === "done" ? (
          <p className="relative z-[1] whitespace-nowrap text-[14.5px] font-medium text-[#ABD2FA]">
            Subscribed! Check your email.
          </p>
        ) : (
          <form onSubmit={onSubmit} className="relative z-[1] flex items-stretch gap-2 max-sm:flex-col">
            <input
              type="email"
              value={alertEmail}
              onChange={(e) => setAlertEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="h-[50px] w-[240px] rounded-full border border-white/[0.14] bg-white/[0.06] px-[18px] text-[14.5px] text-white outline-none transition-all duration-[0.18s] placeholder:text-white/40 focus:border-[#ABD2FA] focus:bg-white/[0.10] focus:shadow-[0_0_0_3px_rgba(171,210,250,0.18)] max-sm:w-full"
            />
            <button
              type="submit"
              disabled={alertStatus === "submitting"}
              className="inline-flex h-[50px] items-center gap-1.5 rounded-full bg-[#f1f5f9] px-[22px] text-[14px] font-semibold text-[#0c1529] transition-all duration-[0.18s] hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_8px_20px_rgba(255,255,255,0.15)] disabled:opacity-50"
            >
              {alertStatus === "submitting" ? "Subscribing..." : "Subscribe"}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M5 12h14" /><path d="m13 5 7 7-7 7" />
              </svg>
            </button>
          </form>
        )}
        {alertStatus === "error" && (
          <p className="relative z-[1] text-[13px] text-red-400">
            Something went wrong. Please try again.
          </p>
        )}
      </div>
    </section>
  );
}
