import { z } from "zod";
import {
  MAX_RESUME_BYTES,
  hasAllowedResumeExtension,
  isAllowedResumeMime,
} from "@/lib/storage/upload-limits";
import type { CustomFieldInput } from "@/schemas/template";

export const requiredFileSchema = z.custom<File>(
  (value) => value instanceof File && value.size > 0,
  "A file is required",
);

export const resumeFileSchema = requiredFileSchema
  .superRefine((value, ctx) => {
    if (!(value instanceof File)) {
      return;
    }

    if (value.size > MAX_RESUME_BYTES) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Resume file must be 5 MB or smaller",
      });
    }

    if (!isAllowedResumeMime(value.type) && !hasAllowedResumeExtension(value.name ?? "")) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Resume must be a PDF, DOC, DOCX, TXT, or CSV file",
      });
    }
  });

export const jobApplicationSchema = z.object({
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
    .min(7, "Phone number is required")
    .max(20, "Phone too long")
    .regex(/^[+\d\s\-()]*$/, "Invalid phone format"),
  resumeFile: resumeFileSchema,
});

export const jobApplicationSubmissionSchema = jobApplicationSchema.extend({
  jobSlug: z.string().min(1, "Job slug is required"),
});

/** Raw custom values sent by the public application form before field-specific validation. */
export const customFieldValuesSchema = z.record(z.string(), z.string());

/**
 * Builds the value schema from the field definitions saved on a job. Unknown
 * values are stripped so a public request can only persist configured fields.
 */
export function buildCustomFieldValuesSchema(customFields: readonly CustomFieldInput[]) {
  const shape: Record<string, z.ZodType> = {};

  for (const field of customFields) {
    if (field.type === "file") continue;

    shape[field.id] = z.string().optional().default("").superRefine((value, ctx) => {
      if (field.required && value.trim().length === 0) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `${field.label} is required.` });
      }

      if (
        field.type === "select" &&
        value.length > 0 &&
        !field.options?.includes(value)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Invalid selection for ${field.label}.`,
        });
      }
    });
  }

  return z.object(shape).strip();
}

export type JobApplicationInput = z.infer<typeof jobApplicationSchema>;
export type JobApplicationSubmissionInput = z.infer<typeof jobApplicationSubmissionSchema>;

/** Form fields the server can scope an error to (public apply flow + API). */
export type ApplicationErrorField = "email" | "resumeFile";

export interface ApplicationActionResult {
  error?: string;
  field?: ApplicationErrorField;
  success: boolean;
  warning?: string;
}

export const DUPLICATE_APPLICATION_MESSAGE =
  "An application with this email already exists for this position.";
