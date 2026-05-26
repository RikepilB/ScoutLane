"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { moveApplicant } from "@/server/services/pipeline/update";

export function ApplicantStageActions({
  applicantId,
  stages,
  currentStageId,
}: {
  applicantId: string;
  stages: { id: string; name: string }[];
  currentStageId: string | null;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  async function handleChange(stageId: string) {
    if (!stageId || stageId === currentStageId) return;
    const newStage = stages.find((s) => s.id === stageId);
    start(async () => {
      try {
        await moveApplicant(applicantId, stageId);
        router.refresh();
        toast.success(
          newStage ? `Moved to ${newStage.name}` : "Stage updated",
          {
            description: "Use the Compose email panel below to notify the applicant.",
          },
        );
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to update stage");
      }
    });
  }

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-muted-foreground">Pipeline stage</label>
      <select
        value={currentStageId ?? stages[0]?.id ?? ""}
        disabled={pending || stages.length === 0}
        onChange={(e) => void handleChange(e.target.value)}
        className="w-full max-w-xs rounded-xl border border-border/70 bg-white px-4 py-2.5 text-sm outline-none focus:border-sky-500 disabled:opacity-50"
      >
        {stages.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
    </div>
  );
}
