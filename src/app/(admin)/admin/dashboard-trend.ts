const TREND_DAY_COUNT = 14;

interface DailyApplicantCount {
  dateKey: string;
  count: number;
}

export function getUtcTrendStart(now: Date) {
  const start = new Date(now);
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCDate(start.getUTCDate() - (TREND_DAY_COUNT - 1));
  return start;
}

export function buildApplicantTrend(now: Date, dailyCounts: DailyApplicantCount[]) {
  const countsByDate = new Map(dailyCounts.map(({ dateKey, count }) => [dateKey, count]));
  const start = getUtcTrendStart(now);
  const labelFormatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });

  return Array.from({ length: TREND_DAY_COUNT }, (_, index) => {
    const date = new Date(start);
    date.setUTCDate(start.getUTCDate() + index);
    const dateKey = date.toISOString().slice(0, 10);

    return {
      date: labelFormatter.format(date),
      count: countsByDate.get(dateKey) ?? 0,
    };
  });
}
