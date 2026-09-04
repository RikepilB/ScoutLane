import { Search } from "lucide-react";
import { SkillsMultiSelect } from "@/components/applicants/SkillsMultiSelect";

interface ApplicantsFilterFormProps {
  filters: Record<string, string>;
  allInstitutions: string[];
  allDegrees: string[];
  allSkills: string[];
  allTags: string[];
}

export function ApplicantsFilterForm({ filters, allInstitutions, allDegrees, allSkills, allTags }: ApplicantsFilterFormProps) {
  return (
    <form
      method="get"
      className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-card p-4 shadow-sm sm:flex-row sm:flex-wrap sm:items-end"
    >
      <div className="relative min-w-[200px] flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          name="search"
          defaultValue={filters.search || ""}
          placeholder="Search name, email, skills, parsed resume…"
          className="w-full rounded-xl border border-border/70 bg-white py-2 pl-10 pr-4 text-sm outline-none focus:border-sky-500"
        />
      </div>
      {allInstitutions.length > 0 && (
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-medium text-muted-foreground">Institution</label>
          <select
            name="institution"
            defaultValue={filters.institution ?? ""}
            className="rounded-lg border border-border/70 px-3 py-2 text-xs outline-none focus:border-sky-500"
          >
            <option value="">Any</option>
            {allInstitutions.map((inst) => (
              <option key={inst} value={inst}>
                {inst}
              </option>
            ))}
          </select>
        </div>
      )}
      {allDegrees.length > 0 && (
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-medium text-muted-foreground">Field / degree</label>
          <select
            name="degree"
            defaultValue={filters.degree ?? ""}
            className="rounded-lg border border-border/70 px-3 py-2 text-xs outline-none focus:border-sky-500"
          >
            <option value="">Any</option>
            {allDegrees.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="flex flex-col gap-1">
        <label className="text-[11px] font-medium text-muted-foreground">Score min</label>
        <input
          type="number"
          name="scoreMin"
          step="0.01"
          min="0"
          max="1"
          placeholder="0.0"
          defaultValue={filters.scoreMin ?? ""}
          className="w-20 rounded-lg border border-border/70 px-3 py-2 text-xs outline-none focus:border-sky-500"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-[11px] font-medium text-muted-foreground">Score max</label>
        <input
          type="number"
          name="scoreMax"
          step="0.01"
          min="0"
          max="1"
          placeholder="1.0"
          defaultValue={filters.scoreMax ?? ""}
          className="w-20 rounded-lg border border-border/70 px-3 py-2 text-xs outline-none focus:border-sky-500"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-[11px] font-medium text-muted-foreground">Applied from</label>
        <input
          type="date"
          name="dateFrom"
          defaultValue={filters.dateFrom ?? ""}
          className="rounded-lg border border-border/70 px-3 py-2 text-xs outline-none focus:border-sky-500"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-[11px] font-medium text-muted-foreground">Applied to</label>
        <input
          type="date"
          name="dateTo"
          defaultValue={filters.dateTo ?? ""}
          className="rounded-lg border border-border/70 px-3 py-2 text-xs outline-none focus:border-sky-500"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-[11px] font-medium text-muted-foreground">Skills contains</label>
        <SkillsMultiSelect
          name="skills"
          defaultValue={filters.skills ?? ""}
          availableSkills={allSkills}
        />
      </div>
      {allTags.length > 0 && (
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-medium text-muted-foreground">Tags</label>
          <SkillsMultiSelect name="tags" defaultValue={filters.tags ?? ""} availableSkills={allTags} />
        </div>
      )}
      <div className="flex flex-col gap-1">
        <label className="text-[11px] font-medium text-muted-foreground">Sort</label>
        <select
          name="sort"
          defaultValue={filters.sort ?? "createdAt-desc"}
          className="rounded-lg border border-border/70 px-3 py-2 text-xs outline-none focus:border-sky-500"
        >
          <option value="createdAt-desc">Applied (newest)</option>
          <option value="createdAt-asc">Applied (oldest)</option>
          <option value="name-asc">Name A–Z</option>
          <option value="name-desc">Name Z–A</option>
          <option value="institution-asc">Institution A–Z</option>
          <option value="institution-desc">Institution Z–A</option>
          <option value="degree-asc">Degree A–Z</option>
          <option value="degree-desc">Degree Z–A</option>
          <option value="score-desc">Score (high)</option>
          <option value="score-asc">Score (low)</option>
          <option value="interviewDate-desc">Interview (newest)</option>
          <option value="interviewDate-asc">Interview (oldest)</option>
          <option value="pipelineStage-asc">Stage A–Z</option>
          <option value="pipelineStage-desc">Stage Z–A</option>
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-[11px] font-medium text-muted-foreground">Group</label>
        <select
          name="group"
          defaultValue={filters.group ?? ""}
          className="rounded-lg border border-border/70 px-3 py-2 text-xs outline-none focus:border-sky-500"
        >
          <option value="">None</option>
          <option value="institution">Institution</option>
          <option value="degree">Degree / field</option>
          <option value="pipelineStage">Pipeline stage</option>
        </select>
      </div>
      {filters.stageId && filters.stageId !== "all" ? (
        <input type="hidden" name="stageId" value={filters.stageId} />
      ) : null}
      {filters.status && filters.status !== "all" ? (
        <input type="hidden" name="status" value={filters.status} />
      ) : null}
      <button
        type="submit"
        className="inline-flex items-center justify-center rounded-lg bg-slate-950 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800"
      >
        Apply filters
      </button>
    </form>
  );
}
