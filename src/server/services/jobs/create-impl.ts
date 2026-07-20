import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { normalizeAssessmentQuestions } from "@/lib/jobs/assessment";
import { getJobPersistence } from "@/lib/jobs/status";
import { buildJobSlug } from "@/lib/slug";
import type { JobActionResult } from "@/schemas/job";
import { jobCreationSchema } from "@/schemas/job";
import type { Prisma } from "@/generated/prisma/client";

const defaultStages = [
  "New",
  "Reviewing",
  "Shortlisted",
  "Interview",
  "Offered",
  "Rejected",
  "Withdrawn",
];

function stringToArray(value: string): string[] {
  return value
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function createJobImpl(formData: FormData): Promise<JobActionResult> {
  const parsed = jobCreationSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    descriptionUrl: formData.get("descriptionUrl") ?? undefined,
    location: formData.get("location") ?? undefined,
    type: formData.get("type") ?? undefined,
    salary: formData.get("salary") ?? undefined,
    status: formData.get("status"),
    templateId: formData.get("templateId") ?? undefined,
    slug: formData.get("slug") ?? undefined,
    department: formData.get("department") ?? undefined,
    whatYouWillDo: formData.get("whatYouWillDo") ?? undefined,
    requirements: formData.get("requirements") ?? undefined,
    toolsAndSkills: formData.get("toolsAndSkills") ?? undefined,
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
  if (currentUser.role === "GUEST") {
    return { success: false, error: "Guests have read-only access." };
  }

  const organizationId =
    currentUser.organizationId ??
    (
      await prisma.organization.create({
        data: {
          name: "ScoutLane",
          slug: `scoutlane-${currentUser.id.slice(0, 8)}`,
        },
        select: { id: true },
      })
    ).id;

  const persistence = getJobPersistence(parsed.data.status);
  const template = parsed.data.templateId
    ? await prisma.jobTemplate.findFirst({
        where: {
          id: parsed.data.templateId,
          organizationId,
        },
        select: { stageNames: true, name: true, questions: true, customFields: true, jobDescription: true, descriptionUrl: true, department: true, whatYouWillDo: true, requirements: true, toolsAndSkills: true },
      })
    : null;

  const stageNames = template?.stageNames.length ? template.stageNames : defaultStages;
  const assessmentQuestions = normalizeAssessmentQuestions(template?.questions ?? null);
  const assessmentTitle = template?.name ?? null;
  const templateCustomFields = template?.customFields ?? null;

  const createdJob = await prisma.job.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description ?? template?.jobDescription ?? undefined,
      descriptionUrl: parsed.data.descriptionUrl ?? template?.descriptionUrl ?? undefined,
      location: parsed.data.location,
      type: parsed.data.type,
      salary: parsed.data.salary,
      slug: parsed.data.slug ?? buildJobSlug(parsed.data.title),
      department: parsed.data.department ?? template?.department ?? undefined,
      organizationId,
      createdById: currentUser.id,
      published: persistence.published,
      archived: persistence.archived,
      whatYouWillDo: parsed.data.whatYouWillDo ?? template?.whatYouWillDo ?? undefined,
      requirements: parsed.data.requirements
        ? stringToArray(parsed.data.requirements)
        : template?.requirements ?? undefined,
      toolsAndSkills: parsed.data.toolsAndSkills
        ? stringToArray(parsed.data.toolsAndSkills)
        : template?.toolsAndSkills ?? undefined,
      assessmentTitle: assessmentQuestions.length ? assessmentTitle : undefined,
      assessmentQuestions: assessmentQuestions.length ? assessmentQuestions : undefined,
      customFields: templateCustomFields
        ? (templateCustomFields as Prisma.InputJsonValue)
        : undefined,
      stages: {
        create: stageNames.map((name: string, index: number) => ({
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
  revalidatePath("/admin/jobs");

  return {
    success: true,
    jobId: createdJob.id,
    slug: createdJob.slug,
  };
}
