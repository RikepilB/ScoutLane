// @vitest-environment node
import { describe, expect, it } from "vitest";
import { slugify } from "@/lib/slug/slugify";

describe("slugify", () => {
  it("lowercases and replaces spaces with single hyphens", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("strips diacritics via NFKD normalization", () => {
    expect(slugify("Café Mañana")).toBe("cafe-manana");
  });

  it("collapses runs of whitespace, underscores, and hyphens", () => {
    expect(slugify("Senior   Backend___Engineer  --  remote")).toBe(
      "senior-backend-engineer-remote",
    );
  });

  it("trims leading and trailing separators", () => {
    expect(slugify("  --  test  --  ")).toBe("test");
  });

  it("strips characters outside [\\w\\s-]", () => {
    expect(slugify("Go Engineer (#1!) @home")).toBe("go-engineer-1-home");
  });

  it("returns empty string for input with no slug-able characters", () => {
    expect(slugify("!!! ??? ###")).toBe("");
    expect(slugify("")).toBe("");
  });

  it("treats underscores as separators, not word characters", () => {
    expect(slugify("snake_case_name")).toBe("snake-case-name");
  });

  it("preserves digits", () => {
    expect(slugify("React 19 Engineer")).toBe("react-19-engineer");
  });
});
