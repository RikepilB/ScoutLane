"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";

const tabs = [
  { label: "Overview", href: "" },
  { label: "Pipeline", href: "/pipeline" },
  { label: "Stages", href: "/stages" },
  { label: "Form", href: "/form" },
  { label: "Applicants", href: "/applicants" },
  { label: "Integrations", href: "/integrations" },
];

export function JobTabs({ jobId }: { jobId: string }) {
  const pathname = usePathname();

  return (
    <nav className="flex gap-6 border-b border-border/70">
      {tabs.map((tab) => {
        const href = `/admin/jobs/${jobId}${tab.href}`;
        const active = pathname === href;
        return (
          <Link
            key={tab.href}
            href={href}
            className={cn(
              "border-b-2 pb-3 pt-4 text-sm font-medium transition-colors",
              active
                ? "border-slate-950 text-slate-950"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
