"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, MapPin, Briefcase, Bell } from "lucide-react";
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
    <div className="mx-auto max-w-5xl px-6 py-10 space-y-8">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-blue-200">
            Open positions
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-white">
            {filtered.length} {filtered.length === 1 ? "job" : "jobs"} available
          </h2>
        </div>
        <Link
          href="/signin"
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 transition-colors"
        >
          <Briefcase className="h-4 w-4" />
          Dashboard
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search jobs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <select
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
          className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="all">All locations</option>
          {locations.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-blue-300/40 bg-blue-50 px-8 py-12 text-center">
          <p className="text-sm text-slate-600">
            No jobs match your filters.
            <button
              onClick={() => {
                setSearch("");
                setDeptFilter("all");
                setLocationFilter("all");
              }}
              className="ml-1 text-blue-600 underline hover:text-blue-800"
            >
              Clear filters
            </button>
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {[...grouped.entries()].map(([department, deptJobs]) => (
            <section key={department}>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                {department}
              </h3>
              <div className="space-y-1">
                {deptJobs.map((job) => (
                  <div
                    key={job.id}
                    className="group flex flex-col gap-0.5 rounded-lg px-3 py-2.5 hover:bg-blue-50/60 transition-colors"
                  >
                    <Link
                      href={`/careers/${job.slug}`}
                      className="text-base font-semibold text-blue-700 underline decoration-blue-300 underline-offset-4 group-hover:text-blue-900 group-hover:decoration-blue-500 transition-colors"
                    >
                      {job.title}
                    </Link>
                    <span className="text-[13px] text-slate-400">/{job.slug}</span>
                    {job.location && (
                      <span className="flex items-center gap-1 text-[13px] text-slate-500">
                        <MapPin className="h-3 w-3" />
                        {job.location}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
            <Bell className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-slate-900">Create a job alert</h3>
            <p className="mt-1 text-[13px] leading-relaxed text-slate-500">
              Get notified when new positions matching your interests are posted.
            </p>
            {alertStatus === "done" ? (
              <p className="mt-3 text-sm font-medium text-emerald-600">Subscribed! Check your email.</p>
            ) : (
              <form onSubmit={handleAlertSubmit} className="mt-3 flex gap-2">
                <input
                  type="email"
                  value={alertEmail}
                  onChange={(e) => setAlertEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={alertStatus === "submitting"}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {alertStatus === "submitting" ? "Subscribing..." : "Subscribe"}
                </button>
              </form>
            )}
            {alertStatus === "error" && (
              <p className="mt-2 text-sm text-red-600">
                Something went wrong. Please try again.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
