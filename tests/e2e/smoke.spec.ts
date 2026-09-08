import { expect, test } from "@playwright/test";

test("health endpoint responds", async ({ request }) => {
  const response = await request.get("/api/health");
  expect(response.ok()).toBeTruthy();
});

test("signin page splits admin and recruiter workspaces", async ({ page }) => {
  await page.goto("/signin", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("link", { name: "ScoutLane" }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Continue as Admin" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Continue as Recruiter" })).toBeVisible();
});

test("admin sign-in is a dedicated workspace", async ({ page }) => {
  await page.goto("/signin?as=admin", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Sign in as Admin" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Try demo as Admin" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Try demo as Recruiter" })).toHaveCount(0);
});

test("recruiter sign-in is a dedicated workspace", async ({ page }) => {
  await page.goto("/signin?as=recruiter", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Sign in as Recruiter" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Try demo as Recruiter" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Try demo as Admin" })).toHaveCount(0);
});

test("unknown public job slug renders a terminal state", async ({ page }) => {
  await page.goto("/careers/e2e-missing-job", { waitUntil: "domcontentloaded" });
  // Target the terminal heading specifically — a transient "Loading position…"
  // paragraph can coexist in the DOM during streaming, so a loose /position/i
  // regex strict-mode-violates.
  await expect(page.getByRole("heading", { name: "Position not found" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Browse jobs" })).toBeVisible();
});

test("careers landing surfaces published roles and brand subtitle", async ({ page }) => {
  await page.goto("/jobs", { waitUntil: "domcontentloaded" });
  // The brand subtitle renders in the mobile banner and the page content —
  // target the first occurrence so strict mode doesn't see two elements.
  await expect(
    page.getByText(/ScoutLane helps companies post jobs/i).first(),
  ).toBeVisible();
});

test("landing page shows demo entry points", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  // "Job board" appears both in the nav and the footer — scope to the nav link.
  await expect(page.getByRole("navigation").getByRole("link", { name: "Job board" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Try the demo" }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Enter as Admin" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Enter as Recruiter" })).toBeVisible();
  await expect(page.getByRole("heading", { name: /shows its work/i })).toBeVisible();
});

test.skip("admin demo login lands on dashboard", async ({ page }) => {
  // Requires Clerk demo users (admin@scoutlane.dev) in the deployment.
  await page.goto("/signin?as=admin", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Enter as Admin" }).click();
  await page.waitForURL(/\/admin(\/|$)/, { timeout: 10_000 });
  await expect(page).toHaveURL(/\/admin/);
});

test("public applicant can submit an application with a resume", async ({ page }) => {
  await page.goto("/careers/product-manager", { waitUntil: "domcontentloaded" });
  await page.getByLabel("First name").fill("Eve");
  await page.getByLabel("Last name").fill("Tester");
  await page
    .getByLabel("Email")
    .fill(`e2e-applicant-${Date.now()}@example.com`);
  await page.getByLabel("Phone").fill("+1 555 010 2030");
  await page
    .locator('input[type="file"]')
    .setInputFiles("tests/fixtures/sample-resume.pdf");
  await page.getByRole("button", { name: "Submit application" }).click();
  await expect(
    page.getByText("Application submitted successfully."),
  ).toBeVisible({ timeout: 60_000 });
});

test.skip("admin can open a job's applicants list with CSV export", async ({ page }) => {
  // Requires Clerk demo users in the deployment.
  await page.goto("/signin?as=admin", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Enter as Admin" }).click();
  await page.waitForURL(/\/admin(\/|$)/, { timeout: 30_000 });

  await page.goto("/admin/jobs", { waitUntil: "domcontentloaded" });
  await page
    .getByRole("link", { name: "Senior Frontend Engineer" })
    .first()
    .click();
  await page.waitForURL(/\/admin\/jobs\/[^/]+$/, { timeout: 30_000 });

  await page.goto(`${page.url()}/applicants`);

  await expect(
    page.getByRole("link", { name: "Export CSV" }),
  ).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText(/\bTotal\b/)).toBeVisible();
});
