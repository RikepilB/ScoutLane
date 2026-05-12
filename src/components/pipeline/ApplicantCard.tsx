"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export interface Applicant {
  id: string;
  name: string;
  email: string | null;
  score: number | null;
  createdAt: string;
}

export function ApplicantCard({ applicant, stageName }: { applicant: Applicant; stageName: string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: applicant.id,
    data: { stageName },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="cursor-grab rounded-xl border border-border/60 bg-white p-3 shadow-sm transition hover:shadow-md active:cursor-grabbing"
    >
      <div className="text-sm font-medium text-slate-900">{applicant.name}</div>
      {applicant.email && (
        <div className="mt-0.5 truncate text-xs text-muted-foreground">{applicant.email}</div>
      )}
      <div className="mt-2 flex items-center justify-between">
        <span className="text-[11px] text-muted-foreground">
          {new Date(applicant.createdAt).toLocaleDateString()}
        </span>
        {applicant.score && (
          <span className="inline-flex items-center rounded-full bg-sky-50 px-2 py-0.5 text-[11px] font-medium text-sky-700">
            {applicant.score}
          </span>
        )}
      </div>
    </div>
  );
}
