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
  await page.goto("/careers");
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
