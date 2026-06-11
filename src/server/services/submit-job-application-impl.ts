import { Buffer } from "node:buffer";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { canAcceptApplications } from "@/lib/jobs/status";
import { parseApplicantResumeFromBuffer } from "@/lib/resume/parseApplicantResume";
import { uploadFileBuffer } from "@/lib/storage/upload";
import {
  dispatchAdminNotificationEmails,
  dispatchEmail,
  dispatchResumeParse,
} from "@/server/jobs/dispatch";
import {
  DUPLICATE_APPLICATION_MESSAGE,
  type ApplicationActionResult,
  jobApplicationSubmissionSchema,
} from "@/schemas/application";

type ResumeProcessingMode = "inline" | "queue" | "queue-and-inline";
type PublicCustomField = {
  id: string;
  label: string;
  required?: boolean;
};

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

  let customFields: Record<string, string> = {};
  try {
    const raw = formData.get("customFields");
    if (typeof raw === "string") customFields = JSON.parse(raw);
  } catch {
    return { success: false, error: "Invalid custom application fields." };
  }

  const configuredCustomFields = Array.isArray(job.customFields)
    ? (job.customFields as PublicCustomField[])
    : [];
  const missingCustomField = configuredCustomFields.find((field) => {
    if (!field.required) return false;
    const value = customFields[field.id];
    return typeof value !== "string" || value.trim().length === 0;
  });
  if (missingCustomField) {
    return { success: false, error: `${missingCustomField.label} is required.` };
  }

  const resumeBuffer = Buffer.from(await resumeFile.arrayBuffer());
  const resumeFilename = resumeFile.name || "resume.pdf";

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
      payload: { to: email, applicantName, jobTitle: job.title },
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
