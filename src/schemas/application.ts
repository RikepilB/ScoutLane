import { z } from "zod";

export const customFieldValueSchema = z.object({
  id: z.string(),
  label: z.string(),
  value: z.string().max(5000, "Field too long"),
  type: z.enum(["text", "textarea", "select", "file"]),
});

export const applicationSchema = z.object({
  firstName: z
    .string()
    .min(1, "First name is required")
    .max(64, "First name too long")
    .regex(/^[a-zA-ZÀ-ÿ\-' ]+$/, "First name contains invalid characters"),
  lastName: z
    .string()
    .min(1, "Last name is required")
    .max(64, "Last name too long")
    .regex(/^[a-zA-ZÀ-ÿ\-' ]+$/, "Last name contains invalid characters"),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email address")
    .max(320, "Email too long"),
  phone: z
    .string()
    .max(20, "Phone too long")
    .regex(/^[+\d\s\-()]*$/, "Invalid phone format")
    .optional()
    .or(z.literal("")),
  customFields: z.array(customFieldValueSchema).default([]),
  resumeUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
  status: z.enum(["draft", "submitted"]).default("draft"),
  jobSlug: z.string().min(1, "Job slug is required"),
});

export const draftSchema = applicationSchema.extend({
  status: z.literal("draft"),
});

export const submissionSchema = applicationSchema.extend({
  status: z.literal("submitted"),
});

export type ApplicationData = z.infer<typeof applicationSchema>;
export type CustomFieldValue = z.infer<typeof customFieldValueSchema>;
