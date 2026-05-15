"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Calendar } from "lucide-react";
import { formatStageDuration } from "@/lib/utils/date";

export interface Applicant {
  id: string;
  name: string;
  email: string | null;
  score: number | null;
  createdAt: string;
  lastStageChangeAt?: string;
  interviewDate?: string | null;
  institution?: string;
  program?: string;
}

export function ApplicantCard({
  applicant,
  stageId,
  stageName,
}: {
  applicant: Applicant;
  stageId: string;
  stageName: string;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: applicant.id,
    data: { stageId, stageName },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : 1,
  };

  const stageEnteredAt = applicant.lastStageChangeAt ?? applicant.createdAt;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="cursor-grab rounded-xl border border-border/60 bg-white p-3 shadow-sm transition hover:shadow-md active:cursor-grabbing"
    >
      <div className="text-sm font-medium text-slate-900">{applicant.name}</div>
      {applicant.institution && (
        <div className="mt-0.5 truncate text-xs text-slate-600">{applicant.institution}</div>
      )}
      {applicant.program && (
        <div className="mt-0.5 truncate text-xs text-slate-600">{applicant.program}</div>
      )}
      {applicant.email && (
        <div className="mt-0.5 truncate text-xs text-muted-foreground">{applicant.email}</div>
      )}
      {applicant.interviewDate && (
        <div className="mt-1 flex items-center gap-1 text-xs text-violet-600">
          <Calendar className="h-3 w-3" />
          {new Date(applicant.interviewDate).toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      )}
      <div className="mt-2 flex items-center justify-between">
        <span className="text-[11px] text-muted-foreground" title={`In stage since ${new Date(stageEnteredAt).toLocaleString()}`}>
          {formatStageDuration(new Date(stageEnteredAt))}
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
