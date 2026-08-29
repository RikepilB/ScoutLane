import { Buffer } from "node:buffer";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { canAcceptApplications } from "@/lib/jobs/status";
import { parseApplicantResumeFromBuffer } from "@/lib/resume/parseApplicantResume";
import { uploadFileBuffer } from "@/lib/storage/upload";
import { assertResumeUploadAllowed } from "@/lib/storage/upload-limits";
import {
  dispatchAdminNotificationEmails,
  dispatchEmail,
  dispatchResumeParse,
} from "@/server/jobs/dispatch";
import {
  buildCustomFieldValuesSchema,
  customFieldValuesSchema,
  DUPLICATE_APPLICATION_MESSAGE,
  requiredFileSchema,
  type ApplicationActionResult,
  jobApplicationSubmissionSchema,
} from "@/schemas/application";
import { customFieldsSchema } from "@/schemas/template";

type ResumeProcessingMode = "inline" | "queue" | "queue-and-inline";
export function getResumeProcessingMode(): ResumeProcessingMode {
  const raw = process.env.RESUME_PARSE_MODE?.toLowerCase();
  if (raw === "queue" || raw === "queue-and-inline" || raw === "inline") {
    return raw;
  }
  // Default to async queue-only: the applicant must never wait for resume
  // parsing to finish before seeing their submission confirmation. The
  // `worker:resume` process picks up the job and parsing runs in the
  // background (applicant shows a "Parsing…" state until it completes).
  return "queue";
}

export async function submitJobApplicationImpl(
  formData: FormData,
): Promise<ApplicationActionResult> {
  const parsed = jobApplicationSubmissionSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    resumeFile: formData.get("resumeFile"),
    jobSlug: formData.get("jobSlug"),
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid application data",
    };
  }

  const { firstName, jobSlug, lastName, phone, resumeFile } = parsed.data;
  const email = parsed.data.email.trim().toLowerCase();
  const job = await prisma.job.findUnique({
    where: { slug: jobSlug },
    include: {
      organization: {
        select: {
          id: true,
          users: {
            where: { role: { in: ["ADMIN", "RECRUITER", "HIRING_MANAGER"] } },
            select: { email: true },
          },
        },
      },
    },
  });

  if (!job) {
    return { success: false, error: "Job not found." };
  }

  if (!canAcceptApplications(job)) {
    return { success: false, error: "This position is not accepting applications." };
  }

  let rawCustomFields: unknown = {};
  try {
    const raw = formData.get("customFields");
    if (typeof raw === "string") rawCustomFields = JSON.parse(raw);
  } catch {
    return { success: false, error: "Invalid custom application fields." };
  }

  const rawValues = customFieldValuesSchema.safeParse(rawCustomFields);
  if (!rawValues.success) {
    return { success: false, error: "Invalid custom application fields." };
  }

  const configuredFields = customFieldsSchema.safeParse(job.customFields ?? []);
  if (!configuredFields.success) {
    return { success: false, error: "Invalid custom field configuration." };
  }
  const configuredCustomFields = configuredFields.data;

  const customValues = buildCustomFieldValuesSchema(configuredCustomFields).safeParse(rawValues.data);
  if (!customValues.success) {
    return {
      success: false,
      error: customValues.error.issues[0]?.message ?? "Invalid custom application fields.",
    };
  }
  const customFields = customValues.data as Record<string, string>;

  const missingFileField = configuredCustomFields.find((field) =>
    field.type === "file" && field.required
      ? !requiredFileSchema.safeParse(formData.get(`customFile:${field.id}`)).success
      : false,
  );
  if (missingFileField) {
    return { success: false, error: `${missingFileField.label} is required.` };
  }

  const existingApplicant = await prisma.applicant.findFirst({
    where: {
      jobId: job.id,
      email: { equals: email, mode: "insensitive" },
    },
    select: { id: true },
  });

  if (existingApplicant) {
    return {
      success: false,
      field: "email",
      error: DUPLICATE_APPLICATION_MESSAGE,
    };
  }

  let customFileUploads: Array<{
    fieldId: string;
    filename: string;
    contentType: string;
    size: number;
    objectName: string;
    url: string;
  }> = [];

  const pendingFileFields = configuredCustomFields
    .filter((field) => field.type === "file")
    .map((field) => ({ field, file: formData.get(`customFile:${field.id}`) }))
    .filter((entry): entry is { field: (typeof configuredCustomFields)[number]; file: File } =>
      entry.file instanceof File && entry.file.size > 0,
    );

  try {
    customFileUploads = await Promise.all(
      pendingFileFields.map(async ({ field, file }) => {
        try {
          const fileBuffer = Buffer.from(await file.arrayBuffer());
          assertResumeUploadAllowed({
            size: file.size,
            mime: file.type,
            filename: file.name,
            head: fileBuffer,
          });
          const uploaded = await uploadFileBuffer({
            buffer: fileBuffer,
            contentType: file.type || "application/octet-stream",
            filename: file.name || "attachment",
            prefix: "custom-fields",
          });
          customFields[field.id] = uploaded.url;
          return {
            fieldId: field.id,
            filename: file.name || "attachment",
            contentType: uploaded.contentType,
            size: file.size,
            objectName: uploaded.objectName,
            url: uploaded.url,
          };
        } catch (error) {
          throw new Error(
            `${field.label}: ${error instanceof Error ? error.message : "File upload failed."}`,
          );
        }
      }),
    );
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "File upload failed.",
    };
  }

  const resumeBuffer = Buffer.from(await resumeFile.arrayBuffer());
  const resumeFilename = resumeFile.name || "resume.pdf";

  try {
    assertResumeUploadAllowed({
      size: resumeFile.size,
      mime: resumeFile.type,
      filename: resumeFilename,
      head: resumeBuffer,
    });
  } catch (error) {
    return {
      success: false,
      field: "resumeFile",
      error: error instanceof Error ? error.message : "Invalid resume file.",
    };
  }

  let upload;
  try {
    upload = await uploadFileBuffer({
      buffer: resumeBuffer,
      contentType: resumeFile.type || "application/octet-stream",
      filename: resumeFilename,
    });
  } catch (error) {
    console.error("[submit] resume upload failed:", error);
    return {
      success: false,
      field: "resumeFile",
      error:
        "Resume upload is not available right now. Please try again later or contact the hiring team.",
    };
  }
  const applicantName = `${firstName} ${lastName}`.trim();

  const firstStage = await prisma.pipelineStage.findFirst({
    where: { jobId: job.id },
    orderBy: { order: "asc" },
    select: { id: true },
  });

  let applicant;
  try {
    applicant = await prisma.applicant.create({
      data: {
        jobId: job.id,
        pipelineStageId: firstStage?.id ?? null,
        name: applicantName,
        email,
        phone,
        resumeUrl: upload.url,
        status: "NEW",
        parsingStatus: "PENDING",
        lastStageChangeAt: new Date(),
        data: Object.keys(customFields).length > 0 ? { customFields } : undefined,
      },
    });
  } catch (e: unknown) {
    if (
      typeof e === "object" &&
      e !== null &&
      "code" in e &&
      (e as { code: string }).code === "P2002"
    ) {
      return {
        success: false,
        field: "email",
        error: DUPLICATE_APPLICATION_MESSAGE,
      };
    }
    throw e;
  }

  await Promise.all(
    customFileUploads.map((attachment) =>
      prisma.applicantAttachment.create({
        data: {
          applicantId: applicant.id,
          fieldId: attachment.fieldId,
          filename: attachment.filename,
          objectName: attachment.objectName,
          contentType: attachment.contentType,
          size: attachment.size,
        },
      }),
    ),
  );

  let warning: string | undefined;
  const resumeProcessingMode = getResumeProcessingMode();

  try {
    if (resumeProcessingMode === "queue" || resumeProcessingMode === "queue-and-inline") {
      await dispatchResumeParse({
        applicantId: applicant.id,
        resumeUrl: upload.url,
        buffer: resumeBuffer,
        filename: resumeFilename,
      });
    }

    if (resumeProcessingMode === "inline" || resumeProcessingMode === "queue-and-inline") {
      await parseApplicantResumeFromBuffer(applicant.id, resumeBuffer, resumeFilename);
    }
  } catch (error) {
    console.error("[submit] resume processing failed:", error);
    await prisma.applicant
      .update({ where: { id: applicant.id }, data: { parsingStatus: "FAILED" } })
      .catch(() => {});
    warning =
      resumeProcessingMode === "queue"
        ? "Your application was submitted, but resume parsing could not be queued."
        : "Your application was submitted, but resume parsing could not be completed.";
  }

  try {
    await dispatchEmail({
      kind: "applicant-confirmation",
      payload: {
        to: email,
        applicantName,
        jobTitle: job.title,
        organizationId: job.organization?.id,
      },
    });
  } catch (error) {
    console.error("[submit] failed to enqueue applicant confirmation email:", error);
    await prisma.emailLog
      .create({
        data: {
          to: email,
          subject: `Application received for ${job.title}`,
          status: 0,
          error: "ENQUEUE_FAILED: applicant-confirmation",
          organizationId: job.organization?.id,
        },
      })
      .catch(() => {});
    warning = warning
      ? `${warning} The confirmation email could not be queued.`
      : "Your application was submitted, but the confirmation email could not be queued.";
  }

  const adminEmails = job.organization?.users
    .map((u) => u.email)
    .filter((value): value is string => Boolean(value)) ?? [];
  if (adminEmails.length > 0) {
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
    const dashboardUrl = `${appUrl}/admin/jobs/${job.id}/applicants/${applicant.id}`;
    try {
      const fanOut = await dispatchAdminNotificationEmails({
        adminEmails,
        jobTitle: job.title,
        applicantName,
        applicantEmail: email,
        jobUrl: dashboardUrl,
        organizationId: job.organization?.id,
      });
      if (fanOut.failed.length > 0) {
        await Promise.all(
          fanOut.failed.map(({ to, error: enqueueError }) =>
            prisma.emailLog
              .create({
                data: {
                  to,
                  subject: `New application: ${applicantName} → ${job.title}`,
                  status: 0,
                  error: `ENQUEUE_FAILED: ${enqueueError}`,
                  organizationId: job.organization?.id,
                },
              })
              .catch(() => {}),
          ),
        );
      }
    } catch (error) {
      console.error("Failed to enqueue admin notification emails:", error);
      await Promise.all(
        adminEmails.map((to) =>
          prisma.emailLog
            .create({
              data: {
                to,
                subject: `New application: ${applicantName} → ${job.title}`,
                status: 0,
                error: "ENQUEUE_FAILED: admin-new-application (queue unreachable)",
                organizationId: job.organization?.id,
              },
            })
            .catch(() => {}),
        ),
      );
    }
  }

  revalidatePath(`/careers/${job.slug}`);
  return { success: true, warning };
}

