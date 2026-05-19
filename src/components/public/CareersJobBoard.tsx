"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Bell, Briefcase, ChevronRight, MapPin, Search, SlidersHorizontal } from "lucide-react";

export interface CareersJob {
  id: string;
  title: string;
  slug: string;
  department: string;
  location: string | null;
  type: string | null;
}

function unique(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value)))).sort();
}

export function CareersJobBoard({ jobs }: { jobs: CareersJob[] }) {
  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState("all");
  const [location, setLocation] = useState("all");
  const [type, setType] = useState("all");

  const departments = useMemo(() => unique(jobs.map((job) => job.department)), [jobs]);
  const locations = useMemo(() => unique(jobs.map((job) => job.location)), [jobs]);
  const types = useMemo(() => unique(jobs.map((job) => job.type)), [jobs]);

  const filteredJobs = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return jobs.filter((job) => {
      const haystack = [job.title, job.department, job.location, job.type, job.slug]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return (
        (!normalizedQuery || haystack.includes(normalizedQuery)) &&
        (department === "all" || job.department === department) &&
        (location === "all" || job.location === location) &&
        (type === "all" || job.type === type)
      );
    });
  }, [department, jobs, location, query, type]);

  const groupedJobs = useMemo(() => {
    return filteredJobs.reduce<Record<string, CareersJob[]>>((groups, job) => {
      groups[job.department] ??= [];
      groups[job.department].push(job);
      return groups;
    }, {});
  }, [filteredJobs]);

  return (
    <section className="mx-auto w-full max-w-5xl px-5 py-10 sm:px-6 sm:py-12">
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-md bg-blue-50 text-blue-700">
            <Bell className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-slate-950">Create a job alert</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Get notified when new roles match your interests.
            </p>
            <button
              type="button"
              className="mt-1 text-sm font-semibold text-blue-700 underline underline-offset-4 transition hover:text-blue-900"
            >
              Create alert
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-3 md:grid-cols-[1.3fr_1fr_1fr_1fr]">
        <label className="block">
          <span className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
            <Search className="h-3.5 w-3.5" />
            Search
          </span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search jobs"
            className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          />
        </label>

        <label className="block">
          <span className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Department
          </span>
          <select
            value={department}
            onChange={(event) => setDepartment(event.target.value)}
            className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          >
            <option value="all">All departments</option>
            {departments.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
            <MapPin className="h-3.5 w-3.5" />
            Office
          </span>
          <select
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          >
            <option value="all">All locations</option>
            {locations.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
            <Briefcase className="h-3.5 w-3.5" />
            Employment Type
          </span>
          <select
            value={type}
            onChange={(event) => setType(event.target.value)}
            className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          >
            <option value="all">All types</option>
            {types.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-8">
        <p className="text-lg font-bold text-blue-700">{filteredJobs.length} jobs</p>
      </div>

      <div className="mt-7 space-y-10">
        {Object.entries(groupedJobs).map(([group, items]) => (
          <section key={group} className="space-y-3">
            <h2 className="text-2xl font-bold tracking-tight text-blue-700">{group}</h2>
            <div className="divide-y divide-slate-200 border-y border-slate-200">
              {items.map((job) => (
                <article key={job.id} className="py-4">
                  <Link
                    href={`/careers/${job.slug}`}
                    className="group inline-flex max-w-full items-center gap-1 text-lg font-bold text-blue-700 underline decoration-blue-200 underline-offset-4 transition hover:text-blue-950 hover:decoration-blue-700"
                  >
                    <span className="truncate">{job.title}</span>
                    <ChevronRight className="h-4 w-4 shrink-0 transition group-hover:translate-x-0.5" />
                  </Link>
                  <div className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-sm font-medium text-slate-700">
                    <span>{job.department}</span>
                    {job.type ? <span>• {job.type}</span> : null}
                    {job.location ? <span>• {job.location}</span> : null}
                  </div>
                  <Link
                    href={`/careers/${job.slug}`}
                    className="mt-1 inline-block text-xs font-semibold text-blue-600 underline underline-offset-4 transition hover:text-blue-900"
                  >
                    /careers/{job.slug}
                  </Link>
                </article>
              ))}
            </div>
          </section>
        ))}

        {filteredJobs.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
            <h2 className="text-base font-semibold text-slate-950">No roles match those filters.</h2>
            <p className="mt-2 text-sm text-slate-600">Try another department, location, or search term.</p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
