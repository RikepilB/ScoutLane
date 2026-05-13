"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { sendApplicationConfirmationEmail } from "@/lib/email/send";
import { canAcceptApplications } from "@/lib/jobs/status";
import { uploadResumeFile } from "@/lib/storage/upload";
import { jobApplicationSubmissionSchema } from "@/schemas/application";

export interface ApplicationActionResult {
  error?: string;
  success: boolean;
  warning?: string;
}

async function parseResumeBackground(applicantId: string, resumeUrl: string) {
  try {
    await prisma.applicant.update({
      where: { id: applicantId },
      data: { parsingStatus: "PARSING" },
    });

    const response = await fetch(resumeUrl);
    const buffer = await response.arrayBuffer();
    const text = new TextDecoder("utf-8").decode(buffer);

    const { parseResumeWithGemini } = await import("@/lib/llm/resume");
    const parsed = await parseResumeWithGemini(text.slice(0, 10000));

    await prisma.applicant.update({
      where: { id: applicantId },
      data: {
        parsedData: parsed,
        parsingStatus: "COMPLETED",
        data: {
          education: parsed.education.map((e) => ({
            institution: e.institution,
            degree: e.degree,
            field: e.fieldOfStudy,
            graduationYear: e.graduationYear,
          })),
          work: parsed.workHistory.map((w) => ({
            company: w.company,
            title: w.jobTitle,
            duration: w.duration,
          })),
          skills: parsed.skills,
        },
      },
    });
  } catch (error) {
    console.error("Resume parsing failed:", error);
    await prisma.applicant.update({
      where: { id: applicantId },
      data: { parsingStatus: "FAILED" },
    }).catch(() => {});
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

  const upload = await uploadResumeFile(resumeFile);
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

  const applicant = await prisma.applicant.create({
    data: {
      jobId: job.id,
      name: applicantName,
      email,
      phone,
      resumeUrl: upload.url,
      status: "NEW",
      parsingStatus: "PENDING",
      data: Object.keys(customFields).length > 0 ? { customFields } : undefined,
    },
  });

  parseResumeBackground(applicant.id, upload.url).catch((e) =>
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
