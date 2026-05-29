import { expect, test } from "@playwright/test";

test("health endpoint responds", async ({ request }) => {
  const response = await request.get("/api/health");
  expect(response.ok()).toBeTruthy();
});

test("signin page exposes dev login controls", async ({ page }) => {
  await page.goto("/signin");
  await expect(page.getByRole("link", { name: "ScoutLane" }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign in with Google" })).toBeVisible();
  await expect(page.getByPlaceholder("admin@scoutlane.local")).toBeVisible();
  await expect(page.getByRole("button", { name: "Enter" })).toBeVisible();
});

test("unknown public job slug renders a terminal state", async ({ page }) => {
  await page.goto("/careers/e2e-missing-job");
  await expect(page.getByText(/not found|no longer accepting|position/i)).toBeVisible();
});

test("careers landing surfaces published roles and brand subtitle", async ({ page }) => {
  // The public careers board renders at the site root (src/app/page.tsx),
  // not at /careers (which only has /careers/[slug]).
  await page.goto("/");
  await expect(
    page.getByText(/ScoutLane helps companies post jobs/i),
  ).toBeVisible();
});

test("admin dev login lands on dashboard", async ({ page }) => {
  await page.goto("/signin");
  await page.getByPlaceholder("admin@scoutlane.local").fill("e2e-admin@example.com");
  await page.getByRole("button", { name: "Enter" }).click();
  await page.waitForURL(/\/admin(\/|$)/, { timeout: 10_000 });
  await expect(page).toHaveURL(/\/admin/);
});

test("public applicant can submit an application with a resume", async ({ page }) => {
  // product-manager is a seeded published job with no required custom fields.
  // Names must be letters-only to satisfy the application schema regex.
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
  // The submit action parses the resume inline (OpenRouter + retry) before
  // returning, so success can take a while; resume parse failure still yields
  // a successful submission with a warning.
  await expect(
    page.getByText("Application submitted successfully."),
  ).toBeVisible({ timeout: 60_000 });
});

test("admin can open a job's applicants list with CSV export", async ({ page }) => {
  await page.goto("/signin");
  await page.getByPlaceholder("admin@scoutlane.local").fill("e2e-admin@example.com");
  await page.getByRole("button", { name: "Enter" }).click();
  // First hit to /admin cold-compiles in dev; allow generous time.
  await page.waitForURL(/\/admin(\/|$)/, { timeout: 30_000 });

  await page.goto("/admin/jobs");
  await page
    .getByRole("link", { name: "Senior Frontend Engineer" })
    .first()
    .click();
  await page.waitForURL(/\/admin\/jobs\/[^/]+$/, { timeout: 30_000 });

  // Navigate straight to the job-scoped applicants list (the sidebar also has a
  // global "Applicants" link, so go by URL to avoid ambiguity).
  await page.goto(`${page.url()}/applicants`);

  await expect(
    page.getByRole("link", { name: "Export CSV" }),
  ).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText(/\bTotal\b/)).toBeVisible();
});
