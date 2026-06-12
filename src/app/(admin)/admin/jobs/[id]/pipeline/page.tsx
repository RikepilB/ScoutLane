"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { moveApplicant } from "@/server/services/pipeline/update";
import { KanbanBoard, type Stage } from "@/components/pipeline/KanbanBoard";
import { KanbanColumn } from "@/components/pipeline/KanbanColumn";
import { cn } from "@/lib/utils/cn";

interface PipelinePageProps {
  params: Promise<{ id: string }>;
}

export default function PipelinePage({ params }: PipelinePageProps) {
  const router = useRouter();
  const [stages, setStages] = useState<Stage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);

  useEffect(() => {
    params.then((p) => setJobId(p.id));
  }, [params]);

  const fetchStages = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/jobs/${id}/pipeline`);
      if (res.ok) {
        const data = await res.json();
        setStages(data);
      } else {
        toast.error("Failed to load the pipeline. Try refreshing.");
      }
    } catch {
      toast.error("Failed to load the pipeline. Check your connection.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!jobId) return;
    fetchStages(jobId);
  }, [jobId, fetchStages]);

  async function handleRefresh() {
    if (!jobId) return;
    setRefreshing(true);
    await fetchStages(jobId);
    setRefreshing(false);
    router.refresh();
  }

  const handleMoveApplicant = useCallback(
    async (applicantId: string, _fromStageId: string, toStageId: string) => {
      if (!jobId) return;
      try {
        const result = await moveApplicant(applicantId, toStageId);
        if (result.success) {
          const stageName = stages.find((s) => s.id === toStageId)?.name;
          if (!("unchanged" in result && result.unchanged)) {
            toast.success(stageName ? `Moved to ${stageName}.` : "Applicant moved.");
          }
          fetchStages(jobId);
          router.refresh();
        } else {
          toast.error("error" in result && result.error ? result.error : "Could not move the applicant.");
          // Re-fetch so the dropped card snaps back to its real column.
          fetchStages(jobId);
        }
      } catch {
        toast.error("Could not move the applicant. Check your connection and try again.");
        fetchStages(jobId);
      }
    },
    [jobId, router, fetchStages, stages],
  );

  if (loading) {
    return <div className="py-12 text-center text-sm text-muted-foreground">Loading pipeline...</div>;
  }

  return (
    <div className="overflow-x-auto">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Pipeline</h2>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-2 rounded-lg border border-border/70 bg-card px-3 py-2 text-sm font-medium transition hover:bg-muted/20 disabled:opacity-50"
        >
          <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
          Refresh
        </button>
      </div>
      <KanbanBoard stages={stages} onMoveApplicant={handleMoveApplicant}>
        {(stage) => <KanbanColumn key={stage.id} stage={stage} />}
      </KanbanBoard>
    </div>
  );
}
