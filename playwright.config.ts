import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  // 2 retries everywhere: the dev server occasionally hard-reloads
  // mid-navigation or mid-test (Turbopack full reload / OneDrive file touches)
  // aborting gotos (net::ERR_ABORTED) or resetting client state (form fields
  // cleared). Retries hit a warm, stable server.
  retries: 2,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["list"], ["html", { open: "never" }]],
  // Dev-server Turbopack compiles each route on first hit; under parallel
  // workers that cold compile can exceed the default 5s assertion window
  // (seen on /careers/[slug]). Generous expect timeout absorbs it.
  expect: { timeout: 20_000 },
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
  },
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        // Production build + start, not `pnpm dev`: this checkout lives in
        // OneDrive, whose .next sync churn triggers constant Turbopack
        // full-reloads that abort in-flight navigations and reset client
        // state (net::ERR_ABORTED, cleared form fields) — a dozen flaky
        // tests per run. A built server has no watcher and is deterministic;
        // it also exercises the prod storage path (database resume storage).
        command: "pnpm build && pnpm start",
        url: "http://localhost:3000/api/health",
        reuseExistingServer: !process.env.CI,
        timeout: 420_000,
        // Offload resume parsing to the queue so the public apply submit returns
        // promptly in E2E (default mode parses inline via OpenRouter).
        env: { RESUME_PARSE_MODE: "queue" },
      },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 7"] },
    },
  ],
});
