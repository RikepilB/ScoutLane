import { describe, it, expect } from "vitest";

describe("template customFields propagation", () => {
  it("template select object includes customFields", () => {
    const select = {
      stageNames: true,
      name: true,
      questions: true,
      customFields: true,
    };
    expect(select.customFields).toBe(true);
  });
});
