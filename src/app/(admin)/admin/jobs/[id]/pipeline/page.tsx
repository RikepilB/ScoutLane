"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { moveApplicant } from "@/server/services/pipeline/update";
import { KanbanBoard, type Stage } from "@/components/pipeline/KanbanBoard";
import { KanbanColumn } from "@/components/pipeline/KanbanColumn";

interface PipelinePageProps {
  params: Promise<{ id: string }>;
}

export default function PipelinePage({ params }: PipelinePageProps) {
  const router = useRouter();
  const [stages, setStages] = useState<Stage[]>([]);
  const [loading, setLoading] = useState(true);
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

  const handleMoveApplicant = useCallback(
    async (applicantId: string, fromStage: string, toStage: string) => {
      if (!jobId) return;
      const status = toStage.toUpperCase();
      const result = await moveApplicant(applicantId, status);
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
      <KanbanBoard stages={stages} onMoveApplicant={handleMoveApplicant}>
        {(stage) => <KanbanColumn key={stage.id} stage={stage} />}
      </KanbanBoard>
    </div>
  );
}
