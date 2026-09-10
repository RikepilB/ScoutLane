"use client";

import { ApplicantTrendChart, StageDistributionChart } from "./Charts";

interface DashboardChartGridProps {
  stageDistribution: Array<{ status: string; count: number }>;
  applicantTrend: Array<{ date: string; count: number }>;
}

export function DashboardChartGrid({
  stageDistribution,
  applicantTrend,
}: DashboardChartGridProps) {
  return (
    <section
      aria-label="Hiring analytics"
      className="grid gap-4 xl:grid-cols-2"
    >
      <StageDistributionChart data={stageDistribution} />
      <ApplicantTrendChart data={applicantTrend} />
    </section>
  );
}
