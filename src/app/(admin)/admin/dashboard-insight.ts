interface HiringInsightInput {
  newApplicantsThisWeek: number;
  stageDistribution: Array<{ status: string; count: number }>;
}

function formatStage(status: string) {
  const words = status.toLowerCase().replaceAll("_", " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export function buildHiringInsight({
  newApplicantsThisWeek,
  stageDistribution,
}: HiringInsightInput) {
  if (!stageDistribution.length) {
    return "No applicants yet. Your hiring record will build as candidates apply.";
  }

  const busiestStage = stageDistribution.reduce((busiest, stage) => {
    const isBusier = stage.count > busiest.count;
    const winsTie = stage.count === busiest.count && stage.status < busiest.status;
    return isBusier || winsTie ? stage : busiest;
  });
  const weeklyVolume =
    newApplicantsThisWeek === 0
      ? "No new applicants this week"
      : `${newApplicantsThisWeek} new applicant${newApplicantsThisWeek === 1 ? "" : "s"} this week`;
  const candidateLabel = busiestStage.count === 1 ? "candidate" : "candidates";

  return `${weeklyVolume}. ${formatStage(busiestStage.status)} is the busiest stage with ${busiestStage.count} ${candidateLabel}.`;
}
