import { z } from "zod";

const optionalShortString = (max: number, label: string) =>
  z
    .string()
    .max(max, `${label} must be ${max} characters or fewer`)
    .optional()
    .or(z.literal("").transform(() => undefined));

/** A single application form field configured on a job/template. */
export const customFieldSchema = z
  .object({
    id: z.string(),
    label: z.string(),
    type: z.enum(["text", "textarea", "select", "file"]),
    required: z.boolean(),
    options: z
      .array(z.string())
      .transform((options) => options.map((option) => option.trim()).filter(Boolean))
      .optional(),
  })
  .superRefine((field, ctx) => {
    if (field.type === "select" && !field.options?.some((option) => option.trim().length > 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["options"],
        message: "Select fields must include at least one option",
      });
    }
  });

/** Ordered list of configured application form fields. */
export const customFieldsSchema = z.array(customFieldSchema).max(50);

export type CustomFieldInput = z.infer<typeof customFieldSchema>;

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
  customFields: customFieldsSchema
    .optional()
    .default([]),
  department: optionalShortString(80, "Department"),
  whatYouWillDo: z
    .string()
    .max(5000, "Role description must be 5000 characters or fewer")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  requirements: z
    .string()
    .max(3000, "Requirements must be 3000 characters or fewer")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  toolsAndSkills: z
    .string()
    .max(2000, "Tools & Skills must be 2000 characters or fewer")
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

export type TemplateInput = z.infer<typeof templateSchema>;
