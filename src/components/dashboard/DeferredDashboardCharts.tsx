"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

interface DeferredDashboardChartsProps {
  stageDistribution: Array<{ status: string; count: number }>;
  applicantTrend: Array<{ date: string; count: number }>;
}

function DashboardChartSkeleton() {
  return (
    <section
      aria-label="Loading hiring analytics"
      className="grid gap-4 xl:grid-cols-2"
      role="status"
    >
      {["stage", "trend"].map((chart) => (
        <div
          aria-hidden="true"
          className="min-h-[354px] animate-pulse rounded-2xl border border-mist bg-surface p-5 motion-reduce:animate-none"
          key={chart}
        >
          <div className="h-4 w-36 rounded bg-paper-2" />
          <div className="mt-3 h-3 w-52 max-w-full rounded bg-paper-2" />
          <div className="mt-8 h-56 rounded-xl bg-paper" />
        </div>
      ))}
      <span className="sr-only">Loading hiring analytics</span>
    </section>
  );
}

const DashboardChartGrid = dynamic(
  () => import("./DashboardChartGrid").then((module) => module.DashboardChartGrid),
  {
    loading: () => <DashboardChartSkeleton />,
    ssr: false,
  },
);

export function DeferredDashboardCharts(props: DeferredDashboardChartsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if (typeof window.IntersectionObserver !== "function") {
      setShouldLoad(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: "240px 0px" },
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef}>
      {shouldLoad ? <DashboardChartGrid {...props} /> : <DashboardChartSkeleton />}
    </div>
  );
}
