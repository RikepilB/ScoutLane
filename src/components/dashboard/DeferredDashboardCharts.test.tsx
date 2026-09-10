import { act, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DeferredDashboardCharts } from "./DeferredDashboardCharts";

vi.mock("recharts", () => ({
  BarChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Bar: () => null,
  CartesianGrid: () => null,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Tooltip: () => null,
  XAxis: () => null,
  YAxis: () => null,
}));

describe("DeferredDashboardCharts", () => {
  let reveal: IntersectionObserverCallback;
  let disconnect: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    disconnect = vi.fn();

    class IntersectionObserverMock {
      constructor(callback: IntersectionObserverCallback) {
        reveal = callback;
      }

      disconnect = disconnect;
      observe = vi.fn();
      unobserve = vi.fn();
      takeRecords = vi.fn(() => []);
      root = null;
      rootMargin = "240px";
      thresholds = [0];
    }

    vi.stubGlobal("IntersectionObserver", IntersectionObserverMock);
  });

  it("keeps the charts deferred when the section is still outside the margin", () => {
    render(
      <DeferredDashboardCharts
        stageDistribution={[{ status: "NEW", count: 4 }]}
        applicantTrend={[{ date: "Sep 10", count: 2 }]}
      />,
    );

    act(() => {
      reveal([{ isIntersecting: false } as IntersectionObserverEntry], {} as IntersectionObserver);
    });

    expect(screen.queryByRole("heading", { name: "Applicants by stage" })).not.toBeInTheDocument();
    expect(disconnect).not.toHaveBeenCalled();
  });

  it("reserves chart space without loading Recharts before the section approaches", () => {
    render(
      <DeferredDashboardCharts
        stageDistribution={[{ status: "NEW", count: 4 }]}
        applicantTrend={[{ date: "Sep 10", count: 2 }]}
      />,
    );

    expect(screen.getByRole("status", { name: "Loading hiring analytics" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Applicants by stage" })).not.toBeInTheDocument();
  });

  it("loads the real analytics when the reserved section nears the viewport", async () => {
    render(
      <DeferredDashboardCharts
        stageDistribution={[{ status: "NEW", count: 4 }]}
        applicantTrend={[{ date: "Sep 10", count: 2 }]}
      />,
    );

    act(() => {
      reveal([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);
    });

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Applicants by stage" })).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: "Applicants over time" })).toBeInTheDocument();
    });
    expect(disconnect).toHaveBeenCalled();
  });

  it("loads immediately when IntersectionObserver is unavailable", async () => {
    vi.stubGlobal("IntersectionObserver", undefined);

    render(
      <DeferredDashboardCharts
        stageDistribution={[{ status: "NEW", count: 4 }]}
        applicantTrend={[{ date: "Sep 10", count: 2 }]}
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Applicants by stage" })).toBeInTheDocument();
    });
  });
});
