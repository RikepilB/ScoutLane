"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export function StageDistributionChart({ data }: { data: { status: string; count: number }[] }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-ink-900">Applicants by stage</h3>
      <p className="mt-1 text-xs text-muted-foreground">Distribution across all pipeline stages</p>
      <div className="mt-4 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 0, right: 0, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-default)" vertical={false} />
            <XAxis
              dataKey="status"
              tick={{ fontSize: 12, fill: "var(--color-text-muted)" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis tick={{ fontSize: 12, fill: "var(--color-text-muted)" }} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip
              contentStyle={{ fontSize: 13, borderRadius: 8, border: "1px solid var(--color-border-default)" }}
              formatter={(value: any) => [`${value} applicants`]}
            />
            <Bar dataKey="count" fill="var(--color-brand-royal)" radius={[4, 4, 0, 0]} maxBarSize={48} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function ApplicantTrendChart({
  data,
  title = "Applicants over time",
  subtitle = "Daily submissions in the last 14 days",
}: {
  data: { date: string; count: number }[];
  title?: string;
  subtitle?: string;
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-ink-900">{title}</h3>
      <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
      <div className="mt-4 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 0, right: 0, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-default)" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis tick={{ fontSize: 12, fill: "var(--color-text-muted)" }} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip
              contentStyle={{ fontSize: 13, borderRadius: 8, border: "1px solid var(--color-border-default)" }}
              formatter={(value: any) => [`${value} applicants`, "Applications"]}
            />
            <Bar dataKey="count" fill="var(--color-brand-royal)" radius={[4, 4, 0, 0]} maxBarSize={32} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function PipelineStageDistributionChart({ data }: { data: { name: string; count: number }[] }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-ink-900">Applicants by pipeline stage</h3>
      <p className="mt-1 text-xs text-muted-foreground">Counts for this job&apos;s configured stages</p>
      <div className="mt-4 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 0, right: 0, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-default)" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
              tickLine={false}
              axisLine={false}
              interval={0}
              angle={-20}
              textAnchor="end"
              height={60}
            />
            <YAxis tick={{ fontSize: 12, fill: "var(--color-text-muted)" }} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip
              contentStyle={{ fontSize: 13, borderRadius: 8, border: "1px solid var(--color-border-default)" }}
              formatter={(value: unknown) => [`${Number(value ?? 0)} applicants`]}
            />
            <Bar dataKey="count" fill="var(--color-brand-royal)" radius={[4, 4, 0, 0]} maxBarSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function ConversionFunnelChart({
  data,
}: {
  data: { stageName: string; count: number; percentOfTotal: number }[];
}) {
  if (!data.length) {
    return (
      <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-ink-900">Conversion funnel</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Applicants who have ever reached each stage (cumulative, not just current)
        </p>
        <p className="mt-6 text-sm text-muted-foreground">Not enough data yet.</p>
      </div>
    );
  }
  const maxCount = Math.max(1, ...data.map((d) => d.count));
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-ink-900">Conversion funnel</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Applicants who have ever reached each stage (cumulative, not just current)
      </p>
      <div className="mt-4 space-y-2.5">
        {data.map((stage) => (
          <div key={stage.stageName}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="font-medium text-ink-800">{stage.stageName}</span>
              <span className="text-muted-foreground">
                {stage.count} ({stage.percentOfTotal}%)
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-paper-2">
              <div
                className="h-full rounded-full bg-brand-royal"
                style={{ width: `${(stage.count / maxCount) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TopLabelsBarChart({
  title,
  subtitle,
  data,
  labelKey,
}: {
  title: string;
  subtitle: string;
  data: { label: string; count: number }[];
  labelKey: "label";
}) {
  if (!data.length) {
    return (
      <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-ink-900">{title}</h3>
        <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
        <p className="mt-6 text-sm text-muted-foreground">Not enough data yet.</p>
      </div>
    );
  }
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-ink-900">{title}</h3>
      <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
      <div className="mt-4 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 0, right: 0, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-default)" vertical={false} />
            <XAxis
              dataKey={labelKey}
              tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
              tickLine={false}
              axisLine={false}
              interval={0}
              angle={-18}
              textAnchor="end"
              height={70}
            />
            <YAxis tick={{ fontSize: 12, fill: "var(--color-text-muted)" }} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip
              contentStyle={{ fontSize: 13, borderRadius: 8, border: "1px solid var(--color-border-default)" }}
              formatter={(value: unknown) => [`${Number(value ?? 0)} applicants`]}
            />
            <Bar dataKey="count" fill="var(--color-brand-slate)" radius={[4, 4, 0, 0]} maxBarSize={36} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
