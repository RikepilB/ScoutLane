import { describe, it, expect } from "vitest";

describe("CustomField type inference", () => {
  it("CustomField with select type has options array", () => {
    type CustomField = {
      id: string;
      label: string;
      type: "text" | "textarea" | "select" | "file";
      required: boolean;
      options?: string[];
    };
    const field: CustomField = { id: "1", label: "City", type: "select", required: false, options: ["A", "B"] };
    expect(field.options).toHaveLength(2);
  });
});
