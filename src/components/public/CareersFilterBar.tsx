import { DEPARTMENTS } from "@/lib/jobs/departments";

interface CareersFilterBarProps {
  search: string;
  setSearch: (value: string) => void;
  deptFilter: string;
  setDeptFilter: (value: string) => void;
  locationFilter: string;
  setLocationFilter: (value: string) => void;
  locations: string[];
}

export function CareersFilterBar({
  search,
  setSearch,
  deptFilter,
  setDeptFilter,
  locationFilter,
  setLocationFilter,
  locations,
}: CareersFilterBarProps) {
  return (
    <div className="my-6">
      <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] gap-3 rounded-control bg-surface-secondary p-3 max-sm:grid-cols-1">
        {/* Search */}
        <div className="flex h-12 items-center gap-3 rounded-control border border-border bg-surface px-4 text-text-muted focus-within:ring-2 focus-within:ring-ring">
          <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
            <circle cx="11" cy="11" r="7" /><path d="m20 20-3-3" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            aria-label="Search roles"
            placeholder="Search by role, skill, or team..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border-none bg-transparent text-[15px] text-ink-900 outline-none placeholder:text-soft"
          />
        </div>

        {/* Department select */}
        <select
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          aria-label="Department"
          className="h-12 min-w-[160px] cursor-pointer rounded-control border border-border bg-surface px-4 text-sm text-text-primary focus:ring-2 focus:ring-ring"
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
          aria-label="Location"
          className="h-12 min-w-[150px] cursor-pointer rounded-control border border-border bg-surface px-4 text-sm text-text-primary focus:ring-2 focus:ring-ring"
        >
          <option value="all">All locations</option>
          {locations.map((l) => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
