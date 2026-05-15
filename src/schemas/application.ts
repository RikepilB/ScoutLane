import { z } from "zod";

const acceptedResumeTypes = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

export const resumeFileSchema = z
  .custom<File>(
    (value) => value instanceof File && value.size > 0,
    "Resume file is required",
  )
  .superRefine((value, ctx) => {
    if (!(value instanceof File)) {
      return;
    }

    if (value.size > 5 * 1024 * 1024) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Resume file must be 5 MB or smaller",
      });
    }

    if (!acceptedResumeTypes.includes(value.type as (typeof acceptedResumeTypes)[number])) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Resume must be a PDF, DOC, or DOCX file",
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
