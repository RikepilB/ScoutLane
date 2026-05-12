"use client";

import { useSortable } from "@dnd-kit/sortable";
import type { Stage } from "./KanbanBoard";
import { ApplicantCard } from "./ApplicantCard";

export function KanbanColumn({ stage }: { stage: Stage }) {
  const { setNodeRef } = useSortable({ id: stage.id, data: { type: "stage", stageName: stage.name } });

  return (
    <div ref={setNodeRef} className="flex w-72 shrink-0 flex-col gap-3">
      <div className="flex items-center gap-2 px-1">
        <span
          className="h-3 w-3 rounded-full"
          style={{ backgroundColor: stage.color ?? "#6366f1" }}
        />
        <span className="text-sm font-semibold text-slate-900">{stage.name}</span>
        <span className="ml-auto text-xs text-muted-foreground">{stage.applicants.length}</span>
      </div>
      <div className="flex flex-col gap-2 rounded-2xl bg-muted/30 p-3">
        {stage.applicants.map((applicant) => (
          <ApplicantCard
            key={applicant.id}
            applicant={applicant}
            stageName={stage.name}
          />
        ))}
        {stage.applicants.length === 0 && (
          <div className="py-8 text-center text-xs text-muted-foreground">No applicants</div>
        )}
      </div>
    </div>
  );
}
