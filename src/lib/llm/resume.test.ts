import { describe, expect, it } from "vitest";
import { parsedResumeSchema } from "./resume";

describe("parsedResumeSchema", () => {
  it("accepts null company/institution (LLM correctly reports missing data per the prompt contract)", () => {
    const result = parsedResumeSchema.safeParse({
      summary: "Test",
      fullName: "Jane Doe",
      fullNameConfidence: "high",
      email: null,
      emailConfidence: "low",
      phone: null,
      phoneConfidence: "low",
      education: [
        { institution: null, degree: null, fieldOfStudy: null, graduationYear: null, timePeriod: null, confidence: "low" },
      ],
      workHistory: [
        { company: null, jobTitle: "Engineer", duration: "2020-2024", confidence: "medium" },
      ],
      skills: ["Python"],
      skillsConfidence: "high",
    });
    expect(result.success).toBe(true);
  });

  it("still accepts string company/institution", () => {
    const result = parsedResumeSchema.safeParse({
      summary: "Test",
      fullName: "Jane Doe",
      fullNameConfidence: "high",
      email: "jane@example.com",
      emailConfidence: "high",
      phone: null,
      phoneConfidence: "low",
      education: [
        { institution: "Stanford", degree: "MS", fieldOfStudy: "CS", graduationYear: "2020", timePeriod: null, confidence: "high" },
      ],
      workHistory: [
        { company: "Acme Corp", jobTitle: "Engineer", duration: "2020-2024", confidence: "high" },
      ],
      skills: ["Python"],
      skillsConfidence: "high",
    });
    expect(result.success).toBe(true);
  });
});
