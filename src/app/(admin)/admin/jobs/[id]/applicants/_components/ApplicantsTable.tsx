"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { bulkMoveApplicants } from "@/server/services/pipeline/update";
import { buildApplicantsHref, formatDate } from "../_lib/applicant-filters";

interface ApplicantsTableProps {
  applicants: any[];
  jobId: string;
  firstStageId: string | null;
  filters: Record<string, string>;
  page: number;
  pageSize: number;
  totalApplicants: number;
  totalPages: number;
  stages?: { id: string; name: string }[];
  canBulkMove?: boolean;
}

export function ApplicantsTable({
  applicants,
  jobId,
  firstStageId,
  filters,
  page,
  pageSize,
  totalApplicants,
  totalPages,
  stages = [],
  canBulkMove = false,
}: ApplicantsTableProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [targetStageId, setTargetStageId] = useState("");
  const [isPending, startTransition] = useTransition();

  const selectableIds = useMemo(
    () => applicants.filter((a) => !a.isGroup).map((a) => a.id as string),
    [applicants],
  );
  const allSelected = selectableIds.length > 0 && selectableIds.every((id) => selected.has(id));

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(selectableIds));
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleBulkMove() {
    if (!targetStageId || selected.size === 0) return;
    const stageName = stages.find((s) => s.id === targetStageId)?.name ?? "the selected stage";
    if (
      !window.confirm(
        `Move ${selected.size} applicant${selected.size !== 1 ? "s" : ""} to "${stageName}"?`,
      )
    )
      return;

    startTransition(async () => {
      const result = await bulkMoveApplicants(Array.from(selected), targetStageId, jobId);
      if (result.failed.length > 0) {
        toast.error(
          `Moved ${result.movedCount}, ${result.failed.length} failed. Check individual applicants.`,
        );
      } else {
        toast.success(`Moved ${result.movedCount} applicant${result.movedCount !== 1 ? "s" : ""} to ${stageName}.`);
      }
      setSelected(new Set());
      router.refresh();
    });
  }

  return (
    <>
      {canBulkMove && selected.size > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-border/70 bg-slate-50 px-4 py-2.5 text-sm">
          <span className="font-medium text-slate-900">
            {selected.size} selected
          </span>
          <select
            value={targetStageId}
            onChange={(e) => setTargetStageId(e.target.value)}
            className="rounded-lg border border-border/70 bg-white px-2.5 py-1.5 text-xs"
            disabled={isPending}
          >
            <option value="">Move to stage…</option>
            {stages.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <button
            onClick={handleBulkMove}
            disabled={!targetStageId || isPending}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-950 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
          >
            {isPending && <Loader2 className="h-3 w-3 animate-spin" />}
            Move
          </button>
          <button
            onClick={() => setSelected(new Set())}
            disabled={isPending}
            className="text-xs text-muted-foreground hover:underline"
          >
            Clear
          </button>
        </div>
      )}

      {applicants.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-10 text-center text-sm text-muted-foreground">
          No applicants found.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                {canBulkMove && (
                  <th className="w-10 px-5 py-3">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleAll}
                      aria-label="Select all applicants"
                    />
                  </th>
                )}
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Institution</th>
                <th className="px-5 py-3 font-medium">Program</th>
                <th className="px-5 py-3 font-medium">Stage</th>
                <th className="px-5 py-3 font-medium">Score</th>
                <th className="px-5 py-3 font-medium">Applied</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {applicants.map((a: any) => {
                if (a.isGroup) {
                  return (
                    <tr key={a.groupKey} className="bg-muted/30">
                      <td colSpan={canBulkMove ? 7 : 6} className="px-5 py-3 text-xs font-semibold text-muted-foreground">
                        <GraduationCap className="mr-1.5 inline h-3.5 w-3.5" />
                        {a.groupKey} — {a.count} applicant{a.count !== 1 ? "s" : ""}
                      </td>
                    </tr>
                  );
                }
                return (
                  <tr key={a.id} className="hover:bg-muted/20">
                    {canBulkMove && (
                      <td className="px-5 py-4">
                        <input
                          type="checkbox"
                          checked={selected.has(a.id)}
                          onChange={() => toggleOne(a.id)}
                          aria-label={`Select ${a.name}`}
                        />
                      </td>
                    )}
                    <td className="px-5 py-4">
                      <Link
                        href={`/admin/jobs/${jobId}/applicants/${a.id}`}
                        className="font-medium text-slate-950 hover:underline"
                      >
                        {a.name}
                      </Link>
                      {a.tags?.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {a.tags.map((tag: string) => (
                            <span
                              key={tag}
                              className="inline-flex rounded-full bg-sky-50 px-1.5 py-0.5 text-[10px] font-medium text-sky-700"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <GraduationCap className="h-3 w-3 shrink-0" />
                        <span className="truncate">{a.institution ?? "—"}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">
                      <span className="truncate">{a.degree ?? "—"}</span>
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">
                      <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-800">
                        {a.pipelineStage?.name ?? (firstStageId ? "Unassigned" : "—")}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {a.score ? (
                        <span className="inline-flex items-center rounded-full bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-700">
                          {a.score}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">{formatDate(a.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {totalApplicants > 0 && (
        <div className="flex items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>
            Showing {((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, totalApplicants)} of {totalApplicants} applicants
          </p>
          <div className="flex items-center gap-2">
            {page > 1 ? (
              <Link
                href={buildApplicantsHref(jobId, filters, { page: String(page - 1), pageSize: String(pageSize) })}
                className="inline-flex items-center gap-1 rounded-lg border border-border/70 px-3 py-1.5 text-xs font-medium hover:bg-muted/30"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Previous
              </Link>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-lg border border-border/30 px-3 py-1.5 text-xs font-medium text-muted-foreground/40 cursor-not-allowed">
                <ChevronLeft className="h-3.5 w-3.5" />
                Previous
              </span>
            )}
            <span className="text-xs">
              Page {page} of {totalPages}
            </span>
            {page < totalPages ? (
              <Link
                href={buildApplicantsHref(jobId, filters, { page: String(page + 1), pageSize: String(pageSize) })}
                className="inline-flex items-center gap-1 rounded-lg border border-border/70 px-3 py-1.5 text-xs font-medium hover:bg-muted/30"
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-lg border border-border/30 px-3 py-1.5 text-xs font-medium text-muted-foreground/40 cursor-not-allowed">
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </span>
            )}
          </div>
        </div>
      )}
    </>
  );
}
