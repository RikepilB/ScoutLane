import { test, expect } from "@playwright/test";

test("resume comparison shows evidence and handles unavailable AI", async ({ page }) => {
  await page.route("**/api/public/resume-match", route => route.fulfill({ json: {
    score: 0.7,
    matchedEvidence: [{ requirement: "TypeScript", resumeExcerpt: "TypeScript developer with five years" }],
    missingRequirements: ["SQL"],
    rationale: "TypeScript is supported; SQL needs evidence.",
    improvements: ["If you have used SQL, add the project and your responsibility."],
  } }));
  await page.goto("/resume-match");
  await expect(page.getByRole("heading", { name: "Resume match", exact: true })).toBeVisible();
  const visibleNavigationLabels = await page
    .getByRole("navigation", { name: "Main navigation" })
    .locator("a:visible")
    .allTextContents();
  expect(visibleNavigationLabels.slice(1, 5)).toEqual([
    "Home",
    "Job board",
    "Resume match",
    "Privacy & terms",
  ]);
  await page.getByLabel("Your resume").setInputFiles({ name: "resume.txt", mimeType: "text/plain", buffer: Buffer.from("TypeScript developer with five years building accessible applications.") });
  await page.getByLabel("Job description", { exact: true }).fill("Seeking an engineer experienced with TypeScript, SQL and accessible web applications.");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Compare resume", exact: true }).click();
  await expect(page.getByRole("heading", { name: "70% evidence match" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Missing evidence" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: `test-results/resume-match-${test.info().project.name}.png`, fullPage: true, animations: "disabled" });
  await page.getByRole("button", { name: "Switch to dark theme" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-scout-theme", "dark");
  await page.screenshot({ path: `test-results/resume-match-dark-${test.info().project.name}.png`, fullPage: true, animations: "disabled" });
  await page.getByRole("button", { name: "Start another comparison" }).click();
  await page.route("**/api/public/resume-match", route => route.fulfill({ status: 503, json: { error: "Resume matching is temporarily unavailable." } }));
  await page.getByRole("button", { name: "Compare resume", exact: true }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText("temporarily unavailable");
});
