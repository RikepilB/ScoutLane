import { describe, expect, it } from "vitest";
import { csvEscape } from "./csv";

describe("csvEscape", () => {
  it("passes through plain values", () => {
    expect(csvEscape("Alice")).toBe("Alice");
    expect(csvEscape(42)).toBe("42");
    expect(csvEscape(null)).toBe("");
    expect(csvEscape(undefined)).toBe("");
  });

  it("quotes values with commas or quotes", () => {
    expect(csvEscape("Smith, Alice")).toBe('"Smith, Alice"');
    expect(csvEscape('say "hi"')).toBe('"say ""hi"""');
    expect(csvEscape("line one\nline two")).toBe('"line one\nline two"');
  });

  it("neutralizes formula-injection prefixes", () => {
    expect(csvEscape("=SUM(1,2)")).toBe('"\'=SUM(1,2)"');
    expect(csvEscape("+123")).toBe("'+123");
    expect(csvEscape("-1+1")).toBe("'-1+1");
    expect(csvEscape("@cmd")).toBe("'@cmd");
    expect(csvEscape("\t=evil()")).toBe("'\t=evil()".replace(/^\t/, "'\t"));
  });

  it("still quotes after neutralization when needed", () => {
    expect(csvEscape("=1,2")).toBe('"\'=1,2"');
  });

  it("does not mangle benign text starting with those chars", () => {
    expect(csvEscape("should-not-touch")).toBe("should-not-touch");
    expect(csvEscape("email@example.com")).toBe("email@example.com");
  });
});
