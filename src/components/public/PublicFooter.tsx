import Link from "next/link";

const columns = [
  {
    heading: "Product",
    links: [
      { href: "/jobs", label: "Job board" },
      { href: "/signin", label: "Sign in" },
    ],
  },
  {
    heading: "Project",
    links: [
      {
        href: "https://github.com/RikepilB/ScoutLane",
        label: "GitHub",
        external: true,
      },
      { href: "/legal", label: "Legal" },
    ],
  },
];

export function PublicFooter({ tone = "dark" }: { tone?: "dark" | "paper" }) {
  return (
    <footer className={tone === "paper" ? "public-footer-paper border-t border-mist pb-8 pt-10" : "border-t border-border-dark pb-8 pt-12"}>
      <div className="flex flex-col gap-10 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-[320px]">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-control bg-brand-royal font-display text-[14px] font-bold tracking-[-0.04em] text-paper">
              SL
            </span>
            <span className="font-display text-[15px] font-semibold text-paper">
              ScoutLane
            </span>
          </div>
          <p className="mt-4 text-[13px] leading-5 text-paper/55">
            Resumes, role fit and hiring decisions in one place.
            Demo environment, sample data throughout.
          </p>
        </div>

        <div className="flex gap-16">
          {columns.map((col) => (
            <div key={col.heading}>
              <p className="mb-3 text-[12px] font-medium uppercase tracking-[0.08em] text-paper/55">
                {col.heading}
              </p>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    {"external" in link && link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[13px] text-paper/70 no-underline transition-colors hover:text-paper"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-[13px] text-paper/70 no-underline transition-colors hover:text-paper"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-10 border-t border-border-dark pt-6 text-xs text-paper/55">
        © 2026 ScoutLane · Demo environment, sample data throughout
      </div>
    </footer>
  );
}
