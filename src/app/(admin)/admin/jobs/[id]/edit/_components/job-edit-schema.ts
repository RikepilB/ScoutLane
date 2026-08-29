import { z } from "zod";
import { jobStatusSchema } from "@/schemas/job";

export const jobEditSchema = z.object({
  title: z
    .string()
    .min(3, "Job title must be at least 3 characters")
    .max(120, "Job title must be 120 characters or fewer"),
  description: z
    .string()
    .max(12000, "Job description must be 12000 characters or fewer")
    .optional()
    .or(z.literal("")),
  descriptionUrl: z
    .string()
    .url("Description URL must be a valid URL")
    .max(2000, "URL must be 2000 characters or fewer")
    .optional()
    .or(z.literal("")),
  location: z
    .string()
    .max(120, "Location must be 120 characters or fewer")
    .optional()
    .or(z.literal("")),
  type: z
    .string()
    .max(60, "Type must be 60 characters or fewer")
    .optional()
    .or(z.literal("")),
  salary: z
    .string()
    .max(60, "Salary must be 60 characters or fewer")
    .optional()
    .or(z.literal("")),
  department: z
    .string()
    .max(80, "Department must be 80 characters or fewer")
    .optional()
    .or(z.literal("")),
  whatYouWillDo: z
    .string()
    .max(5000, "Role description must be 5000 characters or fewer")
    .optional()
    .or(z.literal("")),
  requirements: z
    .string()
    .max(3000, "Requirements must be 3000 characters or fewer")
    .optional()
    .or(z.literal("")),
  toolsAndSkills: z
    .string()
    .max(2000, "Tools & Skills must be 2000 characters or fewer")
    .optional()
    .or(z.literal("")),
  slug: z
    .string()
    .regex(
      /^[a-z0-9-]+$/,
      "Slug can only contain lowercase letters, numbers, and hyphens",
    )
    .min(3, "Slug must be at least 3 characters")
    .max(80, "Slug must be 80 characters or fewer"),
  status: jobStatusSchema,
});

export type EditJobFormValues = z.infer<typeof jobEditSchema>;
