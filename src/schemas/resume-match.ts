import { z } from "zod";

const boundedText = z.string().trim().min(1).max(240);

export const resumeMatchResultSchema = z.object({
  score: z.number().min(0).max(1),
  matchedEvidence: z
    .array(
      z.object({
        requirement: boundedText,
        resumeExcerpt: z.string().trim().min(12).max(300),
      }),
    )
    .max(6),
  missingRequirements: z.array(boundedText).max(6),
  rationale: z.string().trim().min(1).max(800),
  improvements: z.array(z.string().trim().min(1).max(500)).max(6),
});
export type ResumeMatchResult = z.infer<typeof resumeMatchResultSchema>;
