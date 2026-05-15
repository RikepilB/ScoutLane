import { z } from "zod";

const optionalShortString = (max: number, label: string) =>
  z
    .string()
    .max(max, `${label} must be ${max} characters or fewer`)
    .optional()
    .or(z.literal("").transform(() => undefined));

export const templateSchema = z.object({
  name: z
    .string()
    .min(3, "Template name must be at least 3 characters")
    .max(120, "Template name must be 120 characters or fewer"),
  description: optionalShortString(280, "Template description"),
  title: z
    .string()
    .min(3, "Default job title must be at least 3 characters")
    .max(120, "Default job title must be 120 characters or fewer"),
  jobDescription: z
    .string()
    .max(12000, "Job description must be 12000 characters or fewer")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  descriptionUrl: z
    .string()
    .url("Description URL must be a valid URL")
    .max(2000, "URL must be 2000 characters or fewer")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  location: optionalShortString(120, "Location"),
  type: optionalShortString(60, "Type"),
  salary: optionalShortString(60, "Salary"),
  stageNames: z
    .array(z.string().trim().min(1).max(60))
    .min(1, "Add at least one pipeline stage")
    .max(12, "Templates can include up to 12 stages"),
  questions: z
    .array(
      z.union([
        z.string().trim().min(1).max(240),
        z.object({
          text: z.string().trim().min(1).max(240),
          maxDurationSeconds: z.number().int().min(10).max(600).default(120),
          maxAttempts: z.number().int().min(1).max(10).default(1),
        }),
      ]),
    )
    .min(1, "Add at least one assessment question")
    .max(12, "Templates can include up to 12 screening questions"),
  customFields: z
    .array(
      z.object({
        id: z.string(),
        label: z.string(),
        type: z.enum(["text", "textarea", "select", "file"]),
        required: z.boolean(),
        options: z.array(z.string()).optional(),
      }),
    )
    .optional()
    .default([]),
});

export type TemplateInput = z.infer<typeof templateSchema>;
