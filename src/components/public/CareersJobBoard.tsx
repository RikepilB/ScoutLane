"use client";

import { useMemo, useState } from "react";
import { groupByDepartment, type PublicJob } from "./careers-department-grouping";
import { PublicNav } from "./PublicNav";
import { CareersHero } from "./CareersHero";
import { CareersFilterBar } from "./CareersFilterBar";
import { CareersJobList } from "./CareersJobList";
import { CareersJobAlertSection } from "./CareersJobAlertSection";
import { CareersFooter } from "./CareersFooter";
import { inferDepartment } from "@/lib/jobs/departments";
import { parseLocations } from "@/lib/jobs/locations";

interface Props {
  jobs: PublicJob[];
  count: number;
  session: { user?: { email?: string } } | null;
}

export function CareersJobBoard({ jobs, count, session }: Props) {
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState<string>("all");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [alertEmail, setAlertEmail] = useState("");
  const [alertStatus, setAlertStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");

  // Filter by individual location tokens, not the raw storage string — the
  // DB stores "City A; City B" as one field and a candidate thinks in places.
  const locations = useMemo(() => {
    const set = new Set<string>();
    jobs.forEach((j) => {
      parseLocations(j.location).forEach((loc) => set.add(loc));
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
      if (locationFilter !== "all" && !parseLocations(j.location).includes(locationFilter)) {
        return false;
      }
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
    <div className="relative min-h-screen bg-ink-900 text-paper font-body">
      <div className="pointer-events-none fixed inset-0 z-0 opacity-35"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative z-[1] mx-auto max-w-[1240px] px-7 pb-20 pt-6">
        <PublicNav session={session} className="mb-9" />

        <CareersHero count={count} session={session} />

        <CareersFilterBar
          search={search}
          setSearch={setSearch}
          deptFilter={deptFilter}
          setDeptFilter={setDeptFilter}
          locationFilter={locationFilter}
          setLocationFilter={setLocationFilter}
          locations={locations}
        />

        <CareersJobList grouped={grouped} totalCount={totalCount} count={count} />

        <CareersJobAlertSection
          alertEmail={alertEmail}
          setAlertEmail={setAlertEmail}
          alertStatus={alertStatus}
          onSubmit={handleAlertSubmit}
        />

        <CareersFooter />
      </div>
    </div>
  );
}
