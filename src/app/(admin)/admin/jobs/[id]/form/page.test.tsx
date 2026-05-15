import { describe, it, expect } from "vitest";
import { arrayMove } from "@dnd-kit/sortable";
import type { CustomField } from "./page";

describe("CustomField type", () => {
  it("accepts select type with options array", () => {
    const field: CustomField = { id: "1", label: "City", type: "select", required: false, options: ["A", "B"] };
    expect(field.options).toHaveLength(2);
  });
});

describe("arrayMove reorders fields", () => {
  it("moves item from index 0 to index 2", () => {
    const arr = ["a", "b", "c"];
    const result = arrayMove(arr, 0, 2);
    expect(result).toEqual(["b", "c", "a"]);
  });
});
