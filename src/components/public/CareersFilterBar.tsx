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
  );
}
