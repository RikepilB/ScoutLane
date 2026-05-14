"use client";

import { useCallback, useState, type ReactNode } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";

export interface Applicant {
  id: string;
  name: string;
  email: string | null;
  score: number | null;
  createdAt: string;
  lastStageChangeAt?: string;
}

export interface Stage {
  id: string;
  name: string;
  color: string | null;
  order: number;
  applicants: Applicant[];
}

interface KanbanBoardProps {
  stages: Stage[];
  children: (stage: Stage) => ReactNode;
  onMoveApplicant: (applicantId: string, fromStageId: string, toStageId: string) => void;
}

export function KanbanBoard({ stages, children, onMoveApplicant }: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveId(null);
      const { active, over } = event;
      if (!over) return;

      const activeData = active.data.current;
      const overData = over.data.current;

      if (!activeData || !overData) return;

      const fromStageId = activeData.stageId as string;
      const toStageId = overData.stageId as string;

      if (!fromStageId || !toStageId || fromStageId === toStageId) return;

      onMoveApplicant(active.id as string, fromStageId, toStageId);
    },
    [onMoveApplicant],
  );

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 pb-4">
        {stages.map((stage) => children(stage))}
      </div>
      <DragOverlay>
        {activeId ? (
          <div className="rounded-xl border border-border/60 bg-white p-3 shadow-lg">
            <div className="text-sm font-medium text-slate-900">Moving...</div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
