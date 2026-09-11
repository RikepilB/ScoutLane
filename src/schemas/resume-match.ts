import { z } from "zod";

const exactExcerpt = z.string().trim().min(2).max(300);

const matchedEvidenceSchema = z
  .object({
    jobExcerpt: exactExcerpt,
    resumeExcerpt: exactExcerpt,
  })
  .strict();

const improvementSchema = z.discriminatedUnion("kind", [
  z
    .object({
      kind: z.literal("clarify-existing-evidence"),
      jobExcerpt: exactExcerpt,
      resumeExcerpt: exactExcerpt,
    })
    .strict(),
  z
    .object({
      kind: z.literal("verify-before-adding"),
      jobExcerpt: exactExcerpt,
    })
    .strict(),
]);

export const resumeMatchResultSchema = z.object({
  score: z.number().min(0).max(1),
  matchedEvidence: z.array(matchedEvidenceSchema).max(6),
  missingRequirements: z.array(z.object({ jobExcerpt: exactExcerpt }).strict()).max(6),
  rationale: z.string().trim().min(1).max(800),
  improvements: z.array(improvementSchema).max(6),
});
export type ResumeMatchResult = z.infer<typeof resumeMatchResultSchema>;

export const resumeMatchProviderResultSchema = resumeMatchResultSchema.omit({
  score: true,
  rationale: true,
});
export type ResumeMatchProviderResult = z.infer<typeof resumeMatchProviderResultSchema>;
