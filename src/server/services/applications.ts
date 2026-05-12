"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { sendApplicationConfirmationEmail } from "@/lib/email";
import { canAcceptApplications } from "@/lib/jobs";
import { uploadResumeFile } from "@/lib/storage";
import { jobApplicationSubmissionSchema } from "@/schemas/application";

export interface ApplicationActionResult {
  error?: string;
  success: boolean;
  warning?: string;
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

  const existingApplicant = await prisma.applicant.findFirst({
    where: {
      jobId: job.id,
      email,
    },
    select: { id: true },
  });

  if (existingApplicant) {
    return {
      success: false,
      error: "An application with this email already exists for this position.",
    };
  }

  const upload = await uploadResumeFile(resumeFile);
  const applicantName = `${firstName} ${lastName}`.trim();

  await prisma.applicant.create({
    data: {
      jobId: job.id,
      name: applicantName,
      email,
      phone,
      resumeUrl: upload.url,
      status: "NEW",
    },
  });

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
