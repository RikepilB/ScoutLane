export interface FunnelStage {
  id: string;
  name: string;
  order: number;
}

export interface FunnelApplicant {
  id: string;
  pipelineStageId: string | null;
}

export interface FunnelTransition {
  applicantId: string;
  toStage: string;
}

export interface FunnelResult {
  stageId: string;
  stageName: string;
  order: number;
  count: number;
  percentOfTotal: number;
}

/**
 * Recruiting funnel: for each stage, counts applicants who have ever reached that
 * stage or further (monotonic — reaching "Interview" implies having passed
 * "Screening"), not just applicants currently sitting in that stage.
 *
 * An applicant's furthest-reached stage is the max of their current stage's order
 * and the order of every stage named in their StageTransition history (moves can
 * go backward, e.g. a re-review, so we take the historical max, not just current).
 * An applicant with no pipelineStageId (unassigned) is treated as being at the
 * first configured stage, matching how the rest of the admin UI folds unassigned
 * applicants into the first stage's count.
 */
export function computeConversionFunnel(
  stages: FunnelStage[],
  applicants: FunnelApplicant[],
  transitions: FunnelTransition[],
): FunnelResult[] {
  const sortedStages = [...stages].sort((a, b) => a.order - b.order);
  if (sortedStages.length === 0 || applicants.length === 0) {
    return sortedStages.map((s) => ({ stageId: s.id, stageName: s.name, order: s.order, count: 0, percentOfTotal: 0 }));
  }

  const stageIdToOrder = new Map(sortedStages.map((s) => [s.id, s.order]));
  const stageNameToOrder = new Map(sortedStages.map((s) => [s.name, s.order]));
  const firstOrder = sortedStages[0].order;

  const transitionsByApplicant = new Map<string, number[]>();
  for (const t of transitions) {
    const order = stageNameToOrder.get(t.toStage);
    if (order === undefined) continue;
    const existing = transitionsByApplicant.get(t.applicantId) ?? [];
    existing.push(order);
    transitionsByApplicant.set(t.applicantId, existing);
  }

  const total = applicants.length;
  const counts = new Map<number, number>();

  for (const applicant of applicants) {
    const currentOrder = applicant.pipelineStageId
      ? (stageIdToOrder.get(applicant.pipelineStageId) ?? firstOrder)
      : firstOrder;
    const historyOrders = transitionsByApplicant.get(applicant.id) ?? [];
    const maxOrder = Math.max(currentOrder, ...historyOrders);

    for (const stage of sortedStages) {
      if (maxOrder >= stage.order) {
        counts.set(stage.order, (counts.get(stage.order) ?? 0) + 1);
      }
    }
  }

  return sortedStages.map((s) => {
    const count = counts.get(s.order) ?? 0;
    return {
      stageId: s.id,
      stageName: s.name,
      order: s.order,
      count,
      percentOfTotal: total > 0 ? Math.round((count / total) * 1000) / 10 : 0,
    };
  });
}
