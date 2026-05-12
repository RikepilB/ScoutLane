"use client";

import { useCallback, useEffect, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useRouter } from "next/navigation";
import { moveApplicant } from "@/server/services/pipeline";

interface Applicant {
  id: string;
  name: string;
  email: string | null;
  score: number | null;
  createdAt: string;
}

interface Stage {
  id: string;
  name: string;
  color: string | null;
  order: number;
  applicants: Applicant[];
}

function SortableApplicantCard({ applicant, stageName }: { applicant: Applicant; stageName: string }) {
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

function StageColumn({ stage }: { stage: Stage }) {
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
          <SortableApplicantCard
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

interface PipelinePageProps {
  params: Promise<{ id: string }>;
}

export default function PipelinePage({ params }: PipelinePageProps) {
  const router = useRouter();
  const [stages, setStages] = useState<Stage[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);

  useEffect(() => {
    params.then((p) => setJobId(p.id));
  }, [params]);

  useEffect(() => {
    if (!jobId) return;
    fetchStages(jobId);
  }, [jobId]);

  async function fetchStages(id: string) {
    setLoading(true);
    const res = await fetch(`/api/admin/jobs/${id}/pipeline`);
    if (res.ok) {
      const data = await res.json();
      setStages(data);
    }
    setLoading(false);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      setActiveId(null);
      const { active, over } = event;
      if (!over || !jobId) return;

      const activeData = active.data.current;
      const overData = over.data.current;

      if (!activeData || !overData) return;

      const fromStage = activeData.stageName as string;
      const toStage = overData.stageName as string;

      if (fromStage === toStage) return;

      const status = toStage.toUpperCase();
      const result = await moveApplicant(active.id as string, status);
      if (result.success) {
        fetchStages(jobId);
        router.refresh();
      }
    },
    [jobId, router],
  );

  if (loading) {
    return <div className="py-12 text-center text-sm text-muted-foreground">Loading pipeline...</div>;
  }

  return (
    <div className="overflow-x-auto">
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 pb-4">
          {stages.map((stage) => (
            <StageColumn key={stage.id} stage={stage} />
          ))}
        </div>
        <DragOverlay>
          {activeId ? (
            <div className="rounded-xl border border-border/60 bg-white p-3 shadow-lg">
              <div className="text-sm font-medium text-slate-900">Moving...</div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
