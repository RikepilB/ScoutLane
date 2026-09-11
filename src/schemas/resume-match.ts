import { z } from "zod";

export const matchResultSchema = z.object({
  score: z.number().min(0).max(1),
  matchedSkills: z.array(z.string()).default([]),
  missingSkills: z.array(z.string()).default([]),
  rationale: z.string().max(800),
  improvements: z.array(z.string().max(500)).max(6).optional(),
});
export type MatchResult = z.infer<typeof matchResultSchema>;
