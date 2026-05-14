"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { templateSchema } from "@/schemas/template";
import { getCurrentUserWithOrganization } from "./current-user";

const defaultTemplateStages = [
  "Applied",
  "Screening",
  "Assessment",
  "Interview",
  "Offer",
  "Hired",
  "Rejected",
];

function formDataToTemplateInput(formData: FormData) {
  const stageNames = String(formData.get("stageNames") ?? "")
    .split(/\r?\n/)
    .map((stage) => stage.trim())
    .filter(Boolean);

  const questions = String(formData.get("questions") ?? "")
    .split(/\r?\n/)
    .map((question) => question.trim())
    .filter(Boolean);

  return templateSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") ?? undefined,
    title: formData.get("title"),
    jobDescription: formData.get("jobDescription") ?? undefined,
    location: formData.get("location") ?? undefined,
    type: formData.get("type") ?? undefined,
    salary: formData.get("salary") ?? undefined,
    stageNames,
    questions,
  });
}

export async function createTemplate() {
  const user = await getCurrentUserWithOrganization();
  if (!user) redirect("/signin?callbackUrl=/admin/templates");

  const template = await prisma.jobTemplate.create({
    data: {
      name: "New hiring template",
      description: "A reusable starting point for a role.",
      title: "New role",
      jobDescription: "",
      stageNames: defaultTemplateStages,
      questions: [
        "Tell us about yourself and your background.",
        "Describe a challenging technical problem you have solved recently.",
        "Why are you interested in this role?",
        "What are you hoping to learn next?",
      ],
      organizationId: user.organizationId,
      createdById: user.id,
    },
    select: { id: true },
  });

  revalidatePath("/admin/templates");
  redirect(`/admin/templates/${template.id}`);
}

export async function updateTemplate(id: string, formData: FormData) {
  const user = await getCurrentUserWithOrganization();
  if (!user) redirect("/signin?callbackUrl=/admin/templates");

  const parsed = formDataToTemplateInput(formData);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid template data");
  }

  await prisma.jobTemplate.updateMany({
    where: {
      id,
      organizationId: user.organizationId,
    },
    data: {
      name: parsed.data.name,
      description: parsed.data.description,
      title: parsed.data.title,
      jobDescription: parsed.data.jobDescription,
      location: parsed.data.location,
      type: parsed.data.type,
      salary: parsed.data.salary,
      stageNames: parsed.data.stageNames,
      questions: parsed.data.questions,
    },
  });

  revalidatePath("/admin/templates");
  revalidatePath(`/admin/templates/${id}`);
  redirect("/admin/templates");
}

export async function deleteTemplate(id: string) {
  const user = await getCurrentUserWithOrganization();
  if (!user) redirect("/signin?callbackUrl=/admin/templates");

  await prisma.jobTemplate.deleteMany({
    where: {
      id,
      organizationId: user.organizationId,
    },
  });

  revalidatePath("/admin/templates");
  redirect("/admin/templates");
}
