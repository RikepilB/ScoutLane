import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUserWithOrganization } from "@/server/services/current-user";
import { deleteTemplate, updateTemplate } from "@/server/services/templates";

interface TemplateEditorPageProps {
  params: Promise<{ id: string }>;
}

function questionsToText(questions: unknown) {
  if (!Array.isArray(questions)) return "";
  return questions.filter((question) => typeof question === "string").join("\n");
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
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <Button asChild variant="ghost" size="sm" className="-ml-3">
              <Link href="/admin/templates">
                <ArrowLeft className="h-4 w-4" />
                Templates
              </Link>
            </Button>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
              Edit template
            </h1>
            <p className="text-sm text-muted-foreground">
              Update reusable defaults for future jobs created from this template.
            </p>
          </div>
          <form action={deleteAction}>
            <Button type="submit" variant="outline">
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </form>
        </div>

        <form action={updateAction} className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm sm:p-8">
          <div className="space-y-6">
            <section className="space-y-4">
              <div>
                <h2 className="text-base font-semibold tracking-tight">Template details</h2>
                <p className="text-sm text-muted-foreground">
                  These labels help the team pick the right starting point.
                </p>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="space-y-2 text-sm font-medium">
                  Name
                  <Input name="name" defaultValue={template.name} required />
                </label>
                <label className="space-y-2 text-sm font-medium">
                  Short description
                  <Input name="description" defaultValue={template.description ?? ""} />
                </label>
              </div>
            </section>

            <section className="space-y-4">
              <div>
                <h2 className="text-base font-semibold tracking-tight">Job defaults</h2>
                <p className="text-sm text-muted-foreground">
                  These values prefill new jobs and are copied at creation time.
                </p>
              </div>
              <label className="space-y-2 text-sm font-medium">
                Default job title
                <Input name="title" defaultValue={template.title} required />
              </label>
              <label className="space-y-2 text-sm font-medium">
                Default description
                <Textarea
                  name="jobDescription"
                  className="min-h-48"
                  defaultValue={template.jobDescription ?? ""}
                />
              </label>
              <div className="grid gap-5 sm:grid-cols-3">
                <label className="space-y-2 text-sm font-medium">
                  Location
                  <Input name="location" defaultValue={template.location ?? ""} />
                </label>
                <label className="space-y-2 text-sm font-medium">
                  Type
                  <Input name="type" defaultValue={template.type ?? ""} />
                </label>
                <label className="space-y-2 text-sm font-medium">
                  Salary
                  <Input name="salary" defaultValue={template.salary ?? ""} />
                </label>
              </div>
            </section>

            <section className="grid gap-5 sm:grid-cols-2">
              <label className="space-y-2 text-sm font-medium">
                Pipeline stages
                <Textarea
                  name="stageNames"
                  className="min-h-44"
                  defaultValue={template.stageNames.join("\n")}
                  required
                />
                <span className="block text-xs font-normal text-muted-foreground">
                  One stage per line.
                </span>
              </label>
              <label className="space-y-2 text-sm font-medium">
                Screening questions
                <Textarea
                  name="questions"
                  className="min-h-44"
                  defaultValue={questionsToText(template.questions)}
                />
                <span className="block text-xs font-normal text-muted-foreground">
                  One question per line. These are stored with the template for the job form builder.
                </span>
              </label>
            </section>
          </div>

          <div className="mt-8 flex justify-end">
            <Button type="submit">
              <Save className="h-4 w-4" />
              Save template
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
}
