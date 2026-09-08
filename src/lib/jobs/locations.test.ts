import { describe, expect, it } from "vitest";
import { formatLocations, parseLocations } from "./locations";

describe("parseLocations", () => {
  it("splits semicolon-joined locations into trimmed tokens", () => {
    expect(parseLocations("New York, NY; Remote;  Toronto, Ontario, Canada")).toEqual([
      "New York, NY",
      "Remote",
      "Toronto, Ontario, Canada",
    ]);
  });

  it("deduplicates repeated tokens", () => {
    expect(parseLocations("Remote; Remote; Boston, MA")).toEqual(["Remote", "Boston, MA"]);
  });

  it("returns an empty list for null, undefined, or blank input", () => {
    expect(parseLocations(null)).toEqual([]);
    expect(parseLocations(undefined)).toEqual([]);
    expect(parseLocations("  ")).toEqual([]);
  });
});

describe("formatLocations", () => {
  it("joins tokens with a middle dot", () => {
    expect(formatLocations("Boston, MA; Remote")).toBe("Boston, MA · Remote");
  });

  it("caps the list and counts the remainder", () => {
    expect(formatLocations("A; B; C; D; E", 3)).toBe("A · B · C +2");
  });

  it("returns an empty string when there is nothing to show", () => {
    expect(formatLocations(null)).toBe("");
  });
});
