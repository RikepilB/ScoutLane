"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { getJobPersistence } from "@/lib/jobs";
import { buildJobSlug } from "@/lib/slug";
import { jobCreationSchema } from "@/schemas/job";

const defaultStages = [
  "Applied",
  "Screening",
  "Assessment",
  "Interview",
  "Offer",
  "Hired",
  "Rejected",
];

export interface JobActionResult {
  error?: string;
  jobId?: string;
  slug?: string;
  success: boolean;
}

export async function createJob(formData: FormData): Promise<JobActionResult> {
  const parsed = jobCreationSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid job data",
    };
  }

  const session = await auth();
  const sessionEmail = session?.user?.email;

  if (!sessionEmail) {
    return { success: false, error: "You must be signed in to create a job." };
  }

  const currentUser = await prisma.user.findUnique({
    where: { email: sessionEmail },
    include: { organization: true },
  });

  if (!currentUser) {
    return { success: false, error: "Your user record could not be found." };
  }

  const organizationId =
    currentUser.organizationId ??
    (await prisma.organization.findFirst({ select: { id: true } }))?.id ??
    (
      await prisma.organization.create({
        data: {
          name: "ScoutLane",
          slug: "scoutlane",
        },
        select: { id: true },
      })
    ).id;

  const persistence = getJobPersistence(parsed.data.status);

  const createdJob = await prisma.job.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      slug: buildJobSlug(parsed.data.title),
      organizationId,
      createdById: currentUser.id,
      published: persistence.published,
      archived: persistence.archived,
      stages: {
        create: defaultStages.map((name, index) => ({
          name,
          order: index,
        })),
      },
    },
    select: {
      id: true,
      slug: true,
    },
  });

  revalidatePath("/admin");

  return {
    success: true,
    jobId: createdJob.id,
    slug: createdJob.slug,
  };
}
