import { NewJobForm } from "@/components/admin/NewJobForm";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUserWithOrganization } from "@/server/services/current-user";

interface NewJobPageProps {
  searchParams: Promise<{ template?: string }>;
}

export default async function NewJobPage({ searchParams }: NewJobPageProps) {
  const { template: templateId } = await searchParams;
  const user = await getCurrentUserWithOrganization();

  const template =
    templateId && user?.organizationId
      ? await prisma.jobTemplate.findFirst({
          where: { id: templateId, organizationId: user.organizationId },
        })
      : null;

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-10">
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">
            Admin
          </p>
          <h1 className="text-4xl font-semibold tracking-tight">Create a new job</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Start the role in draft, active, or closed state and let the app generate a
            unique public slug automatically.
          </p>
        </div>

        <NewJobForm
          initialValues={
            template
              ? {
                  title: template.title,
                  description: template.jobDescription ?? "",
                  location: template.location ?? "",
                  type: template.type ?? "",
                  salary: template.salary ?? "",
                }
              : undefined
          }
          templateId={template?.id}
          templateName={template?.name}
        />
      </div>
    </main>
  );
}
