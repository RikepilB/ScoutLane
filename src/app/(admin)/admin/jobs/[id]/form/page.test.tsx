import { describe, it, expect } from "vitest";
import type { CustomField } from "./page";

describe("CustomField type", () => {
  it("accepts select type with options array", () => {
    const field: CustomField = { id: "1", label: "City", type: "select", required: false, options: ["A", "B"] };
    expect(field.options).toHaveLength(2);
  });
});
