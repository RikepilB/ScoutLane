import { describe, it, expect } from "vitest";
import { templateSchema } from "./template";

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
});
