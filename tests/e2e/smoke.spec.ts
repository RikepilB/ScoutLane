import { expect, test } from "@playwright/test";

test("health endpoint responds", async ({ request }) => {
  const response = await request.get("/api/health");
  expect(response.ok()).toBeTruthy();
});

test("signin page splits admin and recruiter workspaces", async ({ page }) => {
  await page.goto("/signin");
  await expect(page.getByRole("link", { name: "ScoutLane" }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Enter as Admin" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Enter as Recruiter" })).toBeVisible();
});

test("admin sign-in is a dedicated workspace", async ({ page }) => {
  await page.goto("/signin?as=admin");
  await expect(page.getByRole("button", { name: "Enter as Admin" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Enter as Recruiter" })).toHaveCount(0);
});

test("recruiter sign-in is a dedicated workspace", async ({ page }) => {
  await page.goto("/signin?as=recruiter");
  await expect(page.getByRole("button", { name: "Enter as Recruiter" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Enter as Admin" })).toHaveCount(0);
});

test("unknown public job slug renders a terminal state", async ({ page }) => {
  await page.goto("/careers/e2e-missing-job");
  await expect(page.getByText(/not found|no longer accepting|position/i)).toBeVisible();
});

test("careers landing surfaces published roles and brand subtitle", async ({ page }) => {
  await page.goto("/jobs");
  await expect(
    page.getByText(/ScoutLane helps companies post jobs/i),
  ).toBeVisible();
});

test("landing page shows demo entry points", async ({ page }) => {
  await page.goto("/");
  // "Job board" appears both in the nav and as a hero CTA — scope to the nav link.
  await expect(page.getByRole("navigation").getByRole("link", { name: "Job board" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Admin sign in" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Recruiter sign in" })).toBeVisible();
  await expect(page.getByRole("heading", { name: /enters the lane/i })).toBeVisible();
});

test.skip("admin demo login lands on dashboard", async ({ page }) => {
  // Requires Clerk demo users (admin@scoutlane.dev) in the deployment.
  await page.goto("/signin?as=admin");
  await page.getByRole("button", { name: "Enter as Admin" }).click();
  await page.waitForURL(/\/admin(\/|$)/, { timeout: 10_000 });
  await expect(page).toHaveURL(/\/admin/);
});

test("public applicant can submit an application with a resume", async ({ page }) => {
  await page.goto("/careers/product-manager");
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
  await page.goto("/signin?as=admin");
  await page.getByRole("button", { name: "Enter as Admin" }).click();
  await page.waitForURL(/\/admin(\/|$)/, { timeout: 30_000 });

  await page.goto("/admin/jobs");
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
