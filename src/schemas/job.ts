import { z } from "zod";

export const jobStatusValues = ["draft", "active", "closed"] as const;

export const jobStatusSchema = z.enum(jobStatusValues);

export const jobCreationSchema = z.object({
  title: z
    .string()
    .min(3, "Job title must be at least 3 characters")
    .max(120, "Job title must be 120 characters or fewer"),
  description: z
    .string()
    .min(20, "Job description must be at least 20 characters")
    .max(12000, "Job description must be 12000 characters or fewer"),
  status: jobStatusSchema.default("draft"),
});

export type JobCreationInput = z.infer<typeof jobCreationSchema>;
export type JobStatus = z.infer<typeof jobStatusSchema>;
