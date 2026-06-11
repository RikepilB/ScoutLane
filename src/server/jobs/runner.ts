import { after } from "next/server";

export type JobRunnerMode = "worker" | "inline";

/**
 * Decides how background jobs (resume parsing, email delivery) execute.
 *
 * - `worker`: jobs are enqueued to pg-boss and a long-running worker
 *   (`pnpm worker:resume` / `pnpm worker:emails`) processes them.
 * - `inline`: jobs run in the same serverless invocation after the response
 *   is sent (via Next's `after()`), so no worker process is required.
 *
 * `JOB_RUNNER` env wins when set; otherwise Vercel deployments default to
 * `inline` (serverless functions cannot host pg-boss workers) and everything
 * else defaults to `worker`.
 */
export function getJobRunnerMode(): JobRunnerMode {
  const raw = process.env.JOB_RUNNER?.toLowerCase();
  if (raw === "worker" || raw === "inline") {
    return raw;
  }
  return process.env.VERCEL ? "inline" : "worker";
}

/**
 * Schedules a task to run after the current response is flushed. Falls back
 * to fire-and-forget execution outside a request context (e.g. tests,
 * scripts) where `after()` throws.
 */
export function runAfterResponse(label: string, task: () => Promise<void>): void {
  const run = () =>
    task().catch((error) => {
      console.error(`[jobs:${label}] inline task failed:`, error);
    });

  try {
    after(run);
  } catch {
    void run();
  }
}
