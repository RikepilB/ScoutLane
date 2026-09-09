import { expect, test } from "@playwright/test";

test("demo remains readable and recoverable when authentication cannot load", async ({ page }) => {
  // Isolate the unavailable-provider state without minting a ticket or changing an account.
  await page.route("**/*", (route) => {
    const request = route.request();
    if (request.headers()["next-action"] || /https:\/\/[^/]*(?:clerk|accounts\.dev)[^/]*\//.test(request.url())) {
      return route.abort();
    }
    return route.continue();
  });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const recruiter = page.getByRole("button", { name: "Enter as Recruiter", exact: true });
  const admin = page.getByRole("button", { name: "Enter as Admin", exact: true });
  const alerts = page.getByRole("alert").filter({ hasText: "Unable to enter workspace" });
  await recruiter.click();
  await expect(alerts).toHaveCount(1);
  await admin.click();
  await expect(alerts).toHaveCount(2);
  await expect(recruiter).toBeEnabled();
  await expect(admin).toBeEnabled();
  expect(await alerts.nth(0).getAttribute("id")).not.toBe(await alerts.nth(1).getAttribute("id"));
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const refresh = page.getByRole("button", { name: "Refresh page" }).first();
  expect((await refresh.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  await refresh.focus();
  await expect(refresh).toBeFocused();
  await page.screenshot({ path: test.info().outputPath("demo-recovery.png"), fullPage: true });
});
