import { describe, expect, it } from "vitest";
import { isJobShortlinkPath } from "./public-routes";

describe("isJobShortlinkPath", () => {
  it("accepts a bare job slug", () => {
    expect(isJobShortlinkPath("/senior-backend-engineer")).toBe(true);
  });

  it("accepts slugs with query strings", () => {
    expect(isJobShortlinkPath("/senior-backend-engineer?utm=share")).toBe(true);
  });

  it("rejects every top-level app root", () => {
    for (const path of [
      "/",
      "/admin",
      "/admin/jobs",
      "/api",
      "/api/health",
      "/careers",
      "/careers/frontend",
      "/jobs",
      "/jobs/new",
      "/signin",
      "/signin?as=admin",
      "/signup",
      "/choose-role",
      "/access-denied",
    ]) {
      expect(isJobShortlinkPath(path), path).toBe(false);
    }
  });

  it("rejects known static files", () => {
    for (const path of [
      "/robots.txt",
      "/sitemap.xml",
      "/manifest.json",
      "/manifest.webmanifest",
      "/favicon.ico",
      "/favicon.svg",
    ]) {
      expect(isJobShortlinkPath(path), path).toBe(false);
    }
  });
});
