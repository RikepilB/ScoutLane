"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  Briefcase,
  Users,
  Kanban,
  FileEdit,
  Plug,
  BarChart3,
  Tag,
  CheckSquare,
  X,
  HelpCircle,
} from "lucide-react";

const STORAGE_KEY = "scoutlane_onboarding_dismissed_v1";

interface Feature {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
  href: string;
  adminOnly?: boolean;
}

const FEATURES: Feature[] = [
  {
    icon: Briefcase,
    title: "Create a job",
    body: "Write one from scratch, apply a reusable template, or paste a job posting URL to auto-fill the fields.",
    href: "/admin/jobs/new",
  },
  {
    icon: Kanban,
    title: "Move applicants through the pipeline",
    body: "Drag applicants between stages, or select several and bulk-move them at once from the applicants list.",
    href: "/admin/jobs",
  },
  {
    icon: CheckSquare,
    title: "Bulk applicant actions",
    body: "Check the boxes next to multiple applicants in a job's list to move them all to a stage in one action.",
    href: "/admin/jobs",
  },
  {
    icon: Tag,
    title: "Tag applicants",
    body: '“Strong yes”, “Referral” — freeform tags on any applicant, filterable in that job’s list.',
    href: "/admin/jobs",
  },
  {
    icon: BarChart3,
    title: "Pipeline analytics",
    body: "Each job's overview page has a conversion funnel and application-volume charts — who's actually progressing, not just headcount.",
    href: "/admin/jobs",
  },
  {
    icon: FileEdit,
    title: "Reusable templates",
    body: "Save a job's fields, stages, and screening questions as a template. Applying it later copies a snapshot — editing the template later won't change jobs already created from it.",
    href: "/admin/templates",
  },
  {
    icon: Plug,
    title: "Webhooks & integrations",
    body: "Fire an HTTP call to your own systems when an applicant hits a pipeline stage.",
    href: "/admin/integrations",
    adminOnly: true,
  },
  {
    icon: Users,
    title: "Team & roles",
    body: "Admins can export data, delete jobs, and manage integrations/settings. Recruiters and hiring managers get full pipeline access without those.",
    href: "/admin/settings",
    adminOnly: true,
  },
];

export function OnboardingTour({ role }: { role?: string }) {
  const [open, setOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
    try {
      if (!window.localStorage.getItem(STORAGE_KEY)) {
        setOpen(true);
      }
    } catch {
      // localStorage unavailable (private window, blocked) — skip auto-open,
      // the "?" reopen button still works for this session.
    }
  }, []);

  function dismiss() {
    setOpen(false);
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // best-effort only
    }
  }

  const features = FEATURES.filter((f) => !f.adminOnly || role === "ADMIN");

  if (!hydrated) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Show feature tour"
        className="fixed bottom-5 right-5 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-[#0c1529] text-white shadow-[0_8px_20px_rgba(9,21,64,0.25)] transition hover:-translate-y-0.5 hover:bg-[#1B2CC1]"
      >
        <HelpCircle className="h-5 w-5" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="onboarding-title"
        >
          <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[rgba(27,44,193,0.1)] text-[#1B2CC1]">
                  <Sparkles className="h-4.5 w-4.5" />
                </span>
                <div>
                  <h2 id="onboarding-title" className="text-lg font-semibold text-[#0c1529]">
                    Welcome to ScoutLane
                  </h2>
                  <p className="text-xs text-[#5f8ea0]">
                    A quick tour of what you can do here{role ? ` as ${role.toLowerCase().replace("_", " ")}` : ""}.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={dismiss}
                aria-label="Close"
                className="rounded-lg p-1.5 text-[#5f8ea0] hover:bg-[#f1f5f9]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {features.map((f) => (
                <Link
                  key={f.title}
                  href={f.href}
                  onClick={dismiss}
                  className="group flex flex-col gap-2 rounded-xl border border-[#e2e8f0] p-4 text-left transition hover:border-[#1B2CC1]/40 hover:bg-[#f1f5f9]"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f1f5f9] text-[#1B2CC1] group-hover:bg-white">
                    <f.icon className="h-4 w-4" />
                  </span>
                  <span className="text-sm font-medium text-[#0c1529]">{f.title}</span>
                  <span className="text-xs leading-5 text-[#5f8ea0]">{f.body}</span>
                </Link>
              ))}
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-[#e2e8f0] pt-4">
              <p className="text-xs text-[#5f8ea0]">
                Reopen this anytime with the <HelpCircle className="inline h-3 w-3" /> button in the corner.
              </p>
              <button
                type="button"
                onClick={dismiss}
                className="rounded-lg bg-[#0c1529] px-4 py-2 text-xs font-medium text-white hover:bg-[#1B2CC1]"
              >
                Got it, let&rsquo;s go
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
