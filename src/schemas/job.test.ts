// @vitest-environment node
import { describe, expect, it } from "vitest";
import { jobCreationSchema, jobStatusSchema } from "@/schemas/job";

const validBase = {
  title: "Frontend Engineer",
  description: "We are hiring a frontend engineer to ship our app.",
};

describe("jobStatusSchema", () => {
  it.each(["draft", "active", "closed"])("accepts %s", (value) => {
    expect(jobStatusSchema.parse(value)).toBe(value);
  });

  it("rejects unknown values", () => {
    expect(jobStatusSchema.safeParse("archived").success).toBe(false);
    expect(jobStatusSchema.safeParse("").success).toBe(false);
  });
});

describe("jobCreationSchema", () => {
  it("accepts minimum-valid input and defaults status to 'draft'", () => {
    const parsed = jobCreationSchema.parse(validBase);
    expect(parsed.status).toBe("draft");
    expect(parsed.title).toBe(validBase.title);
  });

  it("rejects titles shorter than 3 characters", () => {
    const result = jobCreationSchema.safeParse({ ...validBase, title: "ab" });
    expect(result.success).toBe(false);
  });

  it("rejects titles longer than 120 characters", () => {
    const result = jobCreationSchema.safeParse({
      ...validBase,
      title: "x".repeat(121),
    });
    expect(result.success).toBe(false);
  });

  it("rejects descriptions shorter than 20 characters", () => {
    const result = jobCreationSchema.safeParse({
      ...validBase,
      description: "too short",
    });
    expect(result.success).toBe(false);
  });

  it("rejects descriptions longer than 12000 characters", () => {
    const result = jobCreationSchema.safeParse({
      ...validBase,
      description: "x".repeat(12001),
    });
    expect(result.success).toBe(false);
  });

  // Documented current behavior: the `optionalShortString` helper chains
  // `.optional().or(z.literal("").transform(() => undefined))` — but
  // `.string().max(n)` already accepts `""`, so the `.or()` branch never
  // fires for short-string fields. Only `slug` actually transforms because
  // its regex + min(3) reject `""`, falling through to the literal branch.
  // When the helper is fixed, update these assertions in the same commit.
  it("currently leaves optional short strings as empty strings; only slug transforms to undefined", () => {
    const parsed = jobCreationSchema.parse({
      ...validBase,
      location: "",
      type: "",
      salary: "",
      templateId: "",
      slug: "",
    });
    expect(parsed.location).toBe("");
    expect(parsed.type).toBe("");
    expect(parsed.salary).toBe("");
    expect(parsed.templateId).toBe("");
    expect(parsed.slug).toBeUndefined();
  });

  it("accepts a valid slug and rejects invalid characters", () => {
    expect(
      jobCreationSchema.safeParse({ ...validBase, slug: "frontend-engineer-1" })
        .success,
    ).toBe(true);
    expect(
      jobCreationSchema.safeParse({ ...validBase, slug: "Frontend Engineer" })
        .success,
    ).toBe(false);
    expect(
      jobCreationSchema.safeParse({ ...validBase, slug: "a$b" }).success,
    ).toBe(false);
  });

  it("rejects slugs shorter than 3 or longer than 80 characters", () => {
    expect(jobCreationSchema.safeParse({ ...validBase, slug: "ab" }).success).toBe(
      false,
    );
    expect(
      jobCreationSchema.safeParse({ ...validBase, slug: "a".repeat(81) }).success,
    ).toBe(false);
  });
});
