import { describe, it, expect } from "vitest";
import { customFieldsSchema, templateSchema } from "./template";

describe("templateSchema customFields", () => {
  it("accepts valid customFields array", () => {
    const result = templateSchema.safeParse({
      name: "Test",
      title: "Engineer",
      stageNames: ["Applied"],
      questions: ["Tell us about yourself"],
      customFields: [{ id: "1", label: "City", type: "text", required: false }],
    });
    expect(result.success).toBe(true);
  });

  it("accepts empty customFields array", () => {
    const result = templateSchema.safeParse({
      name: "Test",
      title: "Engineer",
      stageNames: ["Applied"],
      questions: ["Tell us about yourself"],
      customFields: [],
    });
    expect(result.success).toBe(true);
  });

  it("requires at least one option for select fields", () => {
    const result = customFieldsSchema.safeParse([
      { id: "location", label: "Location", type: "select", required: false, options: [] },
    ]);

    expect(result.success).toBe(false);
  });

  it("trims persisted select options and removes blank entries", () => {
    const result = customFieldsSchema.safeParse([
      { id: "location", label: "Location", type: "select", required: true, options: [" Remote "] },
    ]);

    expect(result).toMatchObject({ success: true, data: [{ options: ["Remote"] }] });
    expect(
      customFieldsSchema.parse([
        { id: "location", label: "Location", type: "select", required: true, options: ["Remote", " "] },
      ]),
    ).toMatchObject([{ options: ["Remote"] }]);
  });
});
