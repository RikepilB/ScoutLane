"use server";

import { Buffer } from "node:buffer";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { sendApplicationConfirmationEmail } from "@/lib/email/send";
import { canAcceptApplications } from "@/lib/jobs/status";
import { parseApplicantResumeFromBuffer, parseApplicantResumeFromUrl } from "@/lib/resume/parseApplicantResume";
import { uploadFileBuffer } from "@/lib/storage/upload";
import { jobApplicationSubmissionSchema } from "@/schemas/application";

export interface ApplicationActionResult {
  error?: string;
  success: boolean;
  warning?: string;
}

async function parseResumeBackground(
  applicantId: string,
  source: { buffer: Buffer; filename: string } | { resumeUrl: string },
) {
  try {
    if ("buffer" in source) {
      await parseApplicantResumeFromBuffer(applicantId, source.buffer, source.filename);
    } else {
      await parseApplicantResumeFromUrl(applicantId, source.resumeUrl);
    }
  } catch (error) {
    console.error("Resume parsing failed:", error);
    await prisma.applicant
      .update({
        where: { id: applicantId },
        data: { parsingStatus: "FAILED" },
      })
      .catch(() => {});
  }
}

export async function submitJobApplication(formData: FormData): Promise<ApplicationActionResult> {
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

  const { email, firstName, jobSlug, lastName, phone, resumeFile } = parsed.data;
  const job = await prisma.job.findUnique({
    where: { slug: jobSlug },
  });

  if (!job) {
    return { success: false, error: "Job not found." };
  }

  if (!canAcceptApplications(job)) {
    return { success: false, error: "This position is not accepting applications." };
  }

  const resumeBuffer = Buffer.from(await resumeFile.arrayBuffer());
  const resumeFilename = resumeFile.name || "resume.pdf";

  const upload = await uploadFileBuffer({
    buffer: resumeBuffer,
    contentType: resumeFile.type || "application/octet-stream",
    filename: resumeFilename,
  });
  const applicantName = `${firstName} ${lastName}`.trim();

  const existingApplicant = await prisma.applicant.findFirst({
    where: { jobId: job.id, email },
    select: { id: true },
  });

  if (existingApplicant) {
    return {
      success: false,
      error: "An application with this email already exists for this position.",
    };
  }

  let customFields: Record<string, string> = {};
  try {
    const raw = formData.get("customFields");
    if (typeof raw === "string") customFields = JSON.parse(raw);
  } catch {}

  const firstStage = await prisma.pipelineStage.findFirst({
    where: { jobId: job.id },
    orderBy: { order: "asc" },
    select: { id: true },
  });

  const applicant = await prisma.applicant.create({
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

  parseResumeBackground(applicant.id, { buffer: resumeBuffer, filename: resumeFilename }).catch((e) =>
    console.error("Background parse failed:", e),
  );

  let warning: string | undefined;

  try {
    await sendApplicationConfirmationEmail({
      applicantName,
      jobTitle: job.title,
      to: email,
    });
  } catch (error) {
    console.error("Failed to send application confirmation email:", error);
    warning = "Your application was submitted, but the confirmation email could not be sent.";
  }

  revalidatePath(`/careers/${job.slug}`);
  return { success: true, warning };
}
