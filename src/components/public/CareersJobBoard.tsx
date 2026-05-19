"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
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
  count: number;
  session: { user?: { email?: string } } | null;
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

export function CareersJobBoard({ jobs, count, session }: Props) {
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
    <div className="relative min-h-screen"
      style={{ background: "#0c1529", color: "#f1f5f9", fontFamily: "var(--font-body)" }}>

      {/* Background ambience */}
      <div className="pointer-events-none fixed inset-0 z-0 opacity-35"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)",
          backgroundSize: "32px 32px",
        }}
      />
      <div className="pointer-events-none fixed z-0"
        style={{
          top: "-200px", left: "-100px", width: "700px", height: "700px",
          background: "radial-gradient(circle, rgba(27,44,193,0.35), rgba(27,44,193,0) 70%)",
          filter: "blur(40px)",
        }}
      />
      <div className="pointer-events-none fixed z-0"
        style={{
          top: "100px", right: "-200px", width: "600px", height: "600px",
          background: "radial-gradient(circle, rgba(94,167,197,0.18), rgba(94,167,197,0) 70%)",
          filter: "blur(40px)",
        }}
      />

      <div className="relative z-[1] mx-auto max-w-[1240px] px-7 pb-20 pt-6">
        {/* ── NAV ── */}
        <nav className="mb-9 flex items-center justify-between py-2">
          <Link href="/" className="flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] font-bold text-white"
              style={{
                background: "linear-gradient(135deg, #1B2CC1, #3D518C)",
                fontFamily: "var(--font-display)",
                fontSize: "16px",
                letterSpacing: "-0.04em",
                boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.12), 0 8px 20px rgba(27,44,193,0.35)",
              }}>
              SL
            </span>
            <span className="text-[17px] font-semibold"
              style={{ fontFamily: "var(--font-display)" }}>
              ScoutLane
            </span>
          </Link>
          <div className="flex items-center gap-2.5">
            {!session?.user && (
              <Link
                href="/signin"
                className="inline-flex items-center gap-2 rounded-full border border-white/[0.12] bg-white/[0.06] px-4 py-2 text-[14px] font-medium text-white transition-colors hover:bg-white/[0.10] hover:border-white/[0.20]"
              >
                Sign in
              </Link>
            )}
          </div>
        </nav>

        {/* ── HERO ── */}
        <header className="animate-fade-up relative overflow-hidden rounded-[24px] border border-[#1a2870] px-12 pb-11 pt-14"
          style={{
            background: "radial-gradient(circle at 8% 10%, rgba(27,44,193,0.55), transparent 55%), linear-gradient(170deg, #091540 0%, #0c1529 70%)",
            boxShadow: "0 30px 80px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)",
          }}>
          {/* Grid mask overlay */}
          <div className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage: "linear-gradient(rgba(118,146,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(118,146,255,0.04) 1px, transparent 1px)",
              backgroundSize: "64px 64px",
              backgroundPosition: "-1px -1px",
              WebkitMaskImage: "radial-gradient(ellipse at 70% 50%, black 30%, transparent 75%)",
              maskImage: "radial-gradient(ellipse at 70% 50%, black 30%, transparent 75%)",
            }}
          />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-[600px]">
              {/* Eyebrow pill — brand-hero style */}
              <div className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-[rgba(171,210,250,0.25)] bg-[rgba(171,210,250,0.08)] py-1.5 pl-2 pr-3 text-[10px] font-medium uppercase tracking-[0.12em] text-[#ABD2FA]"
                style={{ fontFamily: "var(--font-mono)" }}>
                <span className="h-1.5 w-1.5 animate-pulse-glow rounded-full bg-[#ABD2FA]" />
                AI-powered recruitment
              </div>

              {/* Title */}
              <h1 className="mb-5 text-[clamp(36px,5vw,46px)] font-medium leading-[1] tracking-[-0.03em] text-[#f1f5f9]"
                style={{ fontFamily: "var(--font-display)" }}>
                Current job openings<br />at ScoutLane
              </h1>

              {/* Subtitle */}
              <p className="mb-8 max-w-[480px] text-[15px] leading-[22px] text-[#f1f5f9]/70">
                Explore our open positions and find the role that matches your skills and ambitions.
              </p>

              {/* Meta line */}
              <div className="flex items-center gap-2.5 text-[12px] uppercase tracking-[0.1em] text-[#f1f5f9]/55"
                style={{ fontFamily: "var(--font-mono)" }}>
                <span className="inline-block h-px w-6 bg-[#5ea7c5]" />
                Open positions · {count} {count === 1 ? "job" : "jobs"} available
              </div>
            </div>

            {/* CTA Buttons — horizontal row */}
            <div className="flex items-center gap-2.5">
              {session?.user ? (
                <Link
                  href="/admin"
                  className="inline-flex h-[31px] items-center rounded-full border border-white/[0.16] bg-white/[0.06] px-6 text-[12.8px] font-medium text-[#f1f5f9] no-underline transition-all duration-[0.18s] hover:bg-white/[0.12]"
                >
                  Dashboard
                </Link>
              ) : (
                <Link
                  href="/signin"
                  className="inline-flex h-[31px] items-center rounded-full border border-white/[0.16] bg-white/[0.06] px-6 text-[12.8px] font-medium text-[#f1f5f9] no-underline transition-all duration-[0.18s] hover:bg-white/[0.12]"
                >
                  Sign in
                </Link>
              )}
              {session?.user ? (
                <Link
                  href="/admin/jobs/new"
                  className="inline-flex h-[31px] items-center gap-1.5 rounded-full px-6 text-[12.4px] font-semibold text-[#f1f5f9] no-underline transition-all duration-[0.18s] hover:-translate-y-0.5"
                  style={{
                    background: "linear-gradient(180deg, #1B2CC1, #161fa8)",
                    boxShadow: "0 8px 20px rgba(27,44,193,0.4), inset 0 1px 0 rgba(255,255,255,0.16)",
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  Post a job
                </Link>
              ) : (
                <Link
                  href="/signin"
                  className="inline-flex h-[31px] items-center gap-1.5 rounded-full px-6 text-[12.4px] font-semibold text-[#f1f5f9] no-underline transition-all duration-[0.18s] hover:-translate-y-0.5"
                  style={{
                    background: "linear-gradient(180deg, #1B2CC1, #161fa8)",
                    boxShadow: "0 8px 20px rgba(27,44,193,0.4), inset 0 1px 0 rgba(255,255,255,0.16)",
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  Post a job
                </Link>
              )}
            </div>
          </div>
        </header>

        {/* ── FILTER BAR ── */}
        <div className="relative z-[5] -mt-6 mb-8 px-9">
          <div className="grid grid-cols-[1fr_auto_auto] gap-2 rounded-[18px] bg-white p-2.5 shadow-[0_24px_60px_rgba(0,0,0,0.45),0_0_0_1px_rgba(255,255,255,0.05)] max-sm:grid-cols-1">
            {/* Search */}
            <div className="flex h-12 items-center gap-3 rounded-xl border border-[#d4d9df] bg-white px-[18px] transition-all duration-[0.18s] focus-within:border-[#1B2CC1] focus-within:shadow-[0_0_0_3px_rgba(27,44,193,0.12)]">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5f8ea0" strokeWidth="1.7">
                <circle cx="11" cy="11" r="7" /><path d="m20 20-3-3" strokeLinecap="round" />
              </svg>
              <input
                type="search"
                placeholder="Search by role, skill, or team..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full border-none bg-transparent text-[15px] text-[#0c1529] outline-none placeholder:text-[#94a3b8]"
              />
              <span className="rounded-md border border-[#d4d9df] bg-[#f1f5f9] px-2 py-0.5 text-[11px] text-[#394050]"
                style={{ fontFamily: "var(--font-mono)" }}>
                ⌘K
              </span>
            </div>

            {/* Department select */}
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="h-12 min-w-[160px] cursor-pointer appearance-none rounded-xl border border-[#d4d9df] bg-white py-0 pl-4 pr-9 text-[14px] text-[#0c1529] focus:border-[#1B2CC1] focus:shadow-[0_0_0_3px_rgba(27,44,193,0.12)] focus:outline-none"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='none' stroke='%23394050' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round' d='M2.5 4.5L6 8l3.5-3.5'/%3E%3C/svg%3E")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 14px center",
              }}
            >
              <option value="all">All departments</option>
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>

            {/* Location select */}
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="h-12 min-w-[150px] cursor-pointer appearance-none rounded-xl border border-[#d4d9df] bg-white py-0 pl-4 pr-9 text-[14px] text-[#0c1529] focus:border-[#1B2CC1] focus:shadow-[0_0_0_3px_rgba(27,44,193,0.12)] focus:outline-none"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='none' stroke='%23394050' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round' d='M2.5 4.5L6 8l3.5-3.5'/%3E%3C/svg%3E")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 14px center",
              }}
            >
              <option value="all">All locations</option>
              {locations.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
        </div>

        {/* ── JOB SHEET ── */}
        {totalCount === 0 ? (
          <section className="animate-fade-up animate-fade-up-delay-2 rounded-[24px] p-[60px_20px] text-center shadow-[0_20px_60px_rgba(0,0,0,0.4)]"
            style={{ background: "#f1f5f9", border: "1px dashed #d4d9df", color: "#0c1529" }}>
            <h3 className="mb-2 text-[20px] text-[#0c1529]" style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}>
              No matching roles right now
            </h3>
            <p className="text-[14px] text-[#394050]">
              Try widening the filters, or set a job alert below &mdash; we&apos;ll ping you when something lands.
            </p>
          </section>
        ) : (
          <section className="animate-fade-up animate-fade-up-delay-2 rounded-[24px] p-10 shadow-[0_20px_60px_rgba(0,0,0,0.4)] max-sm:p-6"
            style={{ background: "#f1f5f9", color: "#0c1529" }}>
            <div className="mb-7 flex items-end justify-between gap-4 border-b border-[#d4d9df] pb-6 max-sm:flex-col max-sm:items-stretch">
              <div>
                <h2 className="mb-1 text-[32px] tracking-[-0.02em] text-[#0c1529]" style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}>
                  Open positions
                </h2>
                <p className="text-[14px] text-[#5f8ea0]">
                  {totalCount} of {count} roles match your filters
                </p>
              </div>
              <div className="flex items-center gap-[18px] text-[11px] uppercase tracking-[0.1em] text-[#5f8ea0]" style={{ fontFamily: "var(--font-mono)" }}>
                <span>Sorted &middot; By dept</span>
                <span className="h-1 w-1 rounded-full bg-[#5f8ea0]" />
                <span>Last sync 2m ago</span>
              </div>
            </div>

            <div className="space-y-2">
              {[...grouped.entries()].map(([department, deptJobs], di) => (
                <div key={department}>
                  <div className={`flex items-center gap-3.5 border-[#d4d9df] py-3.5 ${di === 0 ? "border-t-0 pt-1" : "border-t"}`}>
                    <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#473459]" style={{ fontFamily: "var(--font-mono)" }}>
                      {department}
                    </span>
                    <span className="rounded-full bg-[rgba(94,167,197,0.10)] px-2 py-0.5 text-[11px] text-[#5f8ea0]" style={{ fontFamily: "var(--font-mono)" }}>
                      {deptJobs.length} {deptJobs.length === 1 ? "role" : "roles"}
                    </span>
                    <span className="h-px flex-1" style={{ background: "linear-gradient(90deg, #d4d9df, transparent)" }} />
                  </div>
                  {deptJobs.map((job) => (
                    <Link
                      key={job.id}
                      href={`/careers/${job.slug}`}
                      className="group grid grid-cols-[1fr_auto_auto_auto] items-center gap-6 rounded-[14px] border border-transparent px-5 py-[18px] text-inherit no-underline transition-all duration-[0.2s] hover:translate-x-1 hover:border-[#d4d9df] hover:bg-white hover:shadow-[0_8px_24px_rgba(9,21,64,0.06)] max-sm:grid-cols-1 max-sm:gap-2"
                    >
                      <div className="flex flex-col gap-1.5">
                        <div className="flex flex-wrap items-baseline gap-3">
                          <span className="text-[22px] tracking-[-0.01em] text-[#0c1529] transition-colors duration-[0.18s] group-hover:text-[#1B2CC1]" style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}>
                            {job.title}
                          </span>
                          <span className="text-[12px] text-[#5f8ea0]" style={{ fontFamily: "var(--font-mono)" }}>
                            /{job.slug}
                          </span>
                        </div>
                        <p className="max-w-[580px] text-[13.5px] leading-[1.5] text-[#394050]">
                          {job.department}{job.type ? ` — ${job.type}` : ""}
                        </p>
                      </div>
                      {job.type && (
                        <span className={`inline-flex items-center rounded-full px-3 py-1.5 text-[12px] font-medium ${job.type?.toLowerCase().includes("remote") ? "bg-[rgba(94,167,197,0.15)] text-[#2d6f8a]" : "bg-[rgba(118,146,255,0.14)] text-[#3D518C]"}`}>
                          {job.type}
                        </span>
                      )}
                      {job.location && (
                        <span className="inline-flex items-center gap-1.5 text-[13px] text-[#394050]" style={{ fontFamily: "var(--font-mono)" }}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#5f8ea0" strokeWidth="1.8">
                            <path d="M12 21s-7-7.6-7-12a7 7 0 0 1 14 0c0 4.4-7 12-7 12Z" />
                            <circle cx="12" cy="9" r="2.5" />
                          </svg>
                          {job.location}
                        </span>
                      )}
                      {/* Hover arrow */}
                      <span className="ml-2 flex h-9 w-9 items-center justify-center rounded-full bg-[#0c1529] text-[#f1f5f9] opacity-0 transition-all duration-[0.2s] group-hover:opacity-100 group-hover:translate-x-0 -translate-x-2">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                          <path d="M5 12h14" /><path d="m13 5 7 7-7 7" />
                        </svg>
                      </span>
                    </Link>
                  ))}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── JOB ALERT ── */}
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
              <form onSubmit={handleAlertSubmit} className="relative z-[1] flex items-stretch gap-2 max-sm:flex-col">
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

        {/* ── FOOTER ── */}
        <footer className="mt-[60px] flex items-center justify-between gap-3 border-t border-white/[0.08] py-7 text-[11px] uppercase tracking-[0.08em] text-white/40 max-sm:flex-col max-sm:text-center"
          style={{ fontFamily: "var(--font-mono)" }}>
          <div>&copy; 2026 ScoutLane Inc.</div>
          <div className="flex items-center gap-3">
            <a href="#" className="text-white/50 no-underline hover:text-[#ABD2FA]">Careers</a>
            <a href="#" className="text-white/50 no-underline hover:text-[#ABD2FA]">Press</a>
            <a href="#" className="text-white/50 no-underline hover:text-[#ABD2FA]">Privacy</a>
            <a href="#" className="text-white/50 no-underline hover:text-[#ABD2FA]">Terms</a>
          </div>
          <div>v 4.1.2 &middot; build 8a3f</div>
        </footer>
      </div>
    </div>
  );
}
