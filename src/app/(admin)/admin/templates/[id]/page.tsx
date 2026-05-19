import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUserWithOrganization } from "@/server/services/current-user";
import { deleteTemplate, updateTemplate } from "@/server/services/templates";
import { TemplateEditor } from "./_components/TemplateEditor";

interface TemplateEditorPageProps {
  params: Promise<{ id: string }>;
}

export default async function TemplateEditorPage({ params }: TemplateEditorPageProps) {
  const { id } = await params;
  const user = await getCurrentUserWithOrganization();

  const template = user?.organizationId
    ? await prisma.jobTemplate.findFirst({
        where: { id, organizationId: user.organizationId },
      })
    : null;

  if (!template) notFound();

  const updateAction = updateTemplate.bind(null, template.id);
  const deleteAction = deleteTemplate.bind(null, template.id);

  return (
    <main className="flex-1 bg-background">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-10">
        <TemplateEditor
          template={{
            id: template.id,
            name: template.name,
            description: template.description,
            title: template.title,
            jobDescription: template.jobDescription,
            descriptionUrl: template.descriptionUrl,
            location: template.location,
            type: template.type,
            salary: template.salary,
            department: template.department,
            whatYouWillDo: template.whatYouWillDo,
            requirements: template.requirements as string[] | null,
            toolsAndSkills: template.toolsAndSkills as string[] | null,
            stageNames: template.stageNames,
            questions: template.questions,
            customFields: template.customFields,
          }}
          updateAction={updateAction}
          deleteAction={deleteAction}
        />
      </div>
    </main>
  );
}
