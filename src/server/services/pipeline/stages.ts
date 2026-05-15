"use server";

export async function createStage(jobId: string, name: string, color?: string) {
  const { createStageImpl } = await import("./stages-impl");
  return createStageImpl(jobId, name, color);
}

export async function updateStage(stageId: string, data: { name?: string; color?: string; order?: number }) {
  const { updateStageImpl } = await import("./stages-impl");
  return updateStageImpl(stageId, data);
}

export async function deleteStage(stageId: string, reassignToStageId?: string) {
  const { deleteStageImpl } = await import("./stages-impl");
  return deleteStageImpl(stageId, reassignToStageId);
}

export async function reorderStages(stages: { id: string; order: number }[]) {
  const { reorderStagesImpl } = await import("./stages-impl");
  return reorderStagesImpl(stages);
}
