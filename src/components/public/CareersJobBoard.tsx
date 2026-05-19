"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, MapPin, Bell } from "lucide-react";
import type { Department } from "@/lib/jobs/departments";
import { DEPARTMENTS, inferDepartment } from "@/lib/jobs/departments";

interface PublicJob {
  id: string;
  title: string;
  slug: string;
  location: string | null;
  type: string | null;
  department: string | null;
  createdAt: string;
}

interface Props {
  jobs: PublicJob[];
}

function groupByDepartment(jobs: PublicJob[]): Map<string, PublicJob[]> {
  const map = new Map<string, PublicJob[]>();
  const ordered = [...DEPARTMENTS] as string[];

  for (const dept of ordered) {
    map.set(dept, []);
  }
  map.set("Other", []);

  for (const job of jobs) {
    const dept = job.department ?? inferDepartment(job.title);
    const key = ordered.includes(dept) ? dept : "Other";
    map.get(key)?.push(job);
  }

  for (const key of [...map.keys()]) {
    if (map.get(key)?.length === 0) map.delete(key);
  }

  return map;
}

export function CareersJobBoard({ jobs }: Props) {
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState<string>("all");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [alertEmail, setAlertEmail] = useState("");
  const [alertStatus, setAlertStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");

  const locations = useMemo(() => {
    const set = new Set<string>();
    jobs.forEach((j) => {
      if (j.location) set.add(j.location);
    });
    return [...set].sort();
  }, [jobs]);

  const filtered = useMemo(() => {
    return jobs.filter((j) => {
      if (search) {
        const q = search.toLowerCase();
        if (
          !j.title.toLowerCase().includes(q) &&
          !j.slug.toLowerCase().includes(q) &&
          !(j.location?.toLowerCase().includes(q))
        )
          return false;
      }
      const dept = j.department ?? inferDepartment(j.title);
      if (deptFilter !== "all" && dept !== deptFilter) return false;
      if (locationFilter !== "all" && j.location !== locationFilter) return false;
      return true;
    });
  }, [jobs, search, deptFilter, locationFilter]);

  const grouped = useMemo(() => groupByDepartment(filtered), [filtered]);
  const totalCount = filtered.length;

  async function handleAlertSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!alertEmail || alertStatus === "submitting") return;
    setAlertStatus("submitting");
    try {
      const res = await fetch("/api/public/job-alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: alertEmail }),
      });
      if (res.ok) {
        setAlertStatus("done");
        setAlertEmail("");
      } else {
        setAlertStatus("error");
      }
    } catch {
      setAlertStatus("error");
    }
  }

  return (
    <div className="mt-6 space-y-8">
      <section className="flex flex-col gap-3 rounded-2xl bg-white px-4 py-4 shadow-sm sm:flex-row sm:items-center sm:px-5 sm:py-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            placeholder="Search jobs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 w-full rounded-full border border-slate-200 bg-slate-50 pl-11 pr-4 text-[0.95rem] text-slate-900 placeholder:text-slate-400 focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
          />
        </div>
        <select
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          className="h-11 rounded-full border border-slate-200 bg-slate-50 px-4 text-[0.95rem] text-slate-700 focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb] sm:w-auto"
        >
          <option value="all">All departments</option>
          {DEPARTMENTS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <select
          value={locationFilter}
          onChange={(e) => setLocationFilter(e.target.value)}
          className="h-11 rounded-full border border-slate-200 bg-slate-50 px-4 text-[0.95rem] text-slate-700 focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb] sm:w-auto"
        >
          <option value="all">All locations</option>
          {locations.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
      </section>

      {totalCount === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-8 py-12 text-center shadow-sm">
          <p className="text-sm text-slate-500">
            No jobs match your filters.
            <button
              onClick={() => {
                setSearch("");
                setDeptFilter("all");
                setLocationFilter("all");
              }}
              className="ml-1 text-[#2563eb] underline hover:text-[#1d4ed8]"
            >
              Clear filters
            </button>
          </p>
        </div>
      ) : (
        <div>
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Open positions</h2>
            <p className="text-sm text-slate-500">
              {totalCount} {totalCount === 1 ? "job" : "jobs"} available
            </p>
          </div>

          <div className="space-y-8">
            {[...grouped.entries()].map(([department, deptJobs]) => (
              <section key={department}>
                <h3 className="mb-3 text-[0.75rem] font-semibold uppercase tracking-[0.08em] text-slate-400">
                  {department}
                </h3>
                <div className="divide-y divide-slate-100">
                  {deptJobs.map((job) => (
                    <Link
                      key={job.id}
                      href={`/careers/${job.slug}`}
                      className="flex flex-col gap-1 py-3.5 transition-colors hover:bg-slate-50 px-3 -mx-3 rounded-lg group"
                    >
                      <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
                        <span className="text-base font-semibold text-[#1150ff] group-hover:text-[#0043ce] underline decoration-[#a5b4fc] underline-offset-4 group-hover:decoration-[#1150ff]">
                          {job.title}
                        </span>
                        <span className="text-sm text-slate-400">/{job.slug}</span>
                      </div>
                      {job.location && (
                        <span className="flex items-center gap-1 text-sm text-slate-500">
                          <MapPin className="h-3.5 w-3.5" />
                          {job.location}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4 rounded-[20px] bg-[#e0edff] p-5 sm:flex-row sm:items-center">
        <div className="flex items-start gap-4 sm:flex-1 sm:items-center">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#2563eb] text-white">
            <Bell className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Create a job alert</h3>
            <p className="text-[13px] leading-relaxed text-slate-500">
              Get notified when new positions matching your interests are posted.
            </p>
          </div>
        </div>

        {alertStatus === "done" ? (
          <p className="whitespace-nowrap text-sm font-medium text-emerald-600">
            Subscribed! Check your email.
          </p>
        ) : (
          <form onSubmit={handleAlertSubmit} className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              type="email"
              value={alertEmail}
              onChange={(e) => setAlertEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="h-12 rounded-full border border-[#cbd5f5] px-4 text-sm placeholder:text-slate-400 focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb] sm:w-56"
            />
            <button
              type="submit"
              disabled={alertStatus === "submitting"}
              className="h-12 whitespace-nowrap rounded-full bg-[#2563eb] px-6 text-sm font-medium text-white transition-colors hover:bg-[#1d4ed8] disabled:opacity-50"
            >
              {alertStatus === "submitting" ? "Subscribing..." : "Subscribe"}
            </button>
          </form>
        )}
        {alertStatus === "error" && (
          <p className="whitespace-nowrap text-sm text-red-600">
            Something went wrong. Please try again.
          </p>
        )}
      </div>
    </div>
  );
}
