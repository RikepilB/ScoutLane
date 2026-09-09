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
    <section className="mt-7 border-t border-border-dark-strong">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-7 py-8 max-lg:grid-cols-1">

        <div className="relative z-[1]">
          <h3 className="mb-1.5 text-[26px] tracking-[-0.015em]" style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}>
            Create a job alert
          </h3>
          <p className="max-w-[460px] text-[14.5px] leading-[1.5] text-paper/65">
            Get notified the moment a role matching your skills opens up. No spam, no third-party sharing.
          </p>
        </div>

        {alertStatus === "done" ? (
          <p className="relative z-[1] whitespace-nowrap text-[14.5px] font-medium text-sky">
            Subscribed! Check your email.
          </p>
        ) : (
          <form onSubmit={onSubmit} className="relative z-[1] flex items-stretch gap-2 max-sm:flex-col">
            <input
              type="email"
              aria-label="Email for job alerts"
              value={alertEmail}
              onChange={(e) => setAlertEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="h-[50px] w-[240px] rounded-control border border-border-dark-strong bg-surface-inverse-raised px-4 text-sm text-paper placeholder:text-paper/60 focus:ring-2 focus:ring-sky max-sm:w-full"
            />
            <button
              type="submit"
              disabled={alertStatus === "submitting"}
              className="inline-flex h-[50px] items-center gap-1.5 rounded-control bg-brand-royal px-[22px] text-[14px] font-medium text-paper transition-colors hover:bg-brand-royal-hover disabled:opacity-50"
            >
              {alertStatus === "submitting" ? "Subscribing..." : "Subscribe"}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M5 12h14" /><path d="m13 5 7 7-7 7" />
              </svg>
            </button>
          </form>
        )}
        {alertStatus === "error" && (
          <p className="relative z-[1] text-[13px] text-danger">
            Something went wrong. Please try again.
          </p>
        )}
      </div>
    </section>
  );
}
