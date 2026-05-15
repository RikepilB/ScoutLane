import { z } from "zod";
import { slugify } from "@/lib/slug";

export const jobStatusValues = ["draft", "active", "closed"] as const;

export const jobStatusSchema = z.enum(jobStatusValues);

const optionalShortString = (max: number, label: string) =>
  z
    .string()
    .max(max, `${label} must be ${max} characters or fewer`)
    .optional()
    .or(z.literal("").transform(() => undefined));

export const jobCreationSchema = z.object({
  title: z
    .string()
    .min(3, "Job title must be at least 3 characters")
    .max(120, "Job title must be 120 characters or fewer"),
  description: z
    .string()
    .min(20, "Job description must be at least 20 characters")
    .max(12000, "Job description must be 12000 characters or fewer"),
  location: optionalShortString(120, "Location"),
  type: optionalShortString(60, "Type"),
  salary: optionalShortString(60, "Salary"),
  status: jobStatusSchema.default("draft"),
  templateId: optionalShortString(120, "Template"),
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens")
    .min(3, "Slug must be at least 3 characters")
    .max(80, "Slug must be 80 characters or fewer")
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

export type JobCreationInput = z.infer<typeof jobCreationSchema>;
export type JobStatus = z.infer<typeof jobStatusSchema>;

/** Shared shape for admin job mutations (create, delete, etc.). */
export interface JobActionResult {
  error?: string;
  jobId?: string;
  slug?: string;
  success: boolean;
}

export interface UpdateJobInput {
  title?: string;
  description?: string;
  location?: string;
  type?: string;
  salary?: string;
  slug?: string;
  published?: boolean;
  archived?: boolean;
}
