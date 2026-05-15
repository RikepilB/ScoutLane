import Link from "next/link";
import { FilePlus2, Pencil, Plus, Trash2, Copy } from "lucide-react";
import type { JobTemplate } from "@/generated/prisma/client";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db/prisma";
import { createTemplate, deleteTemplate, duplicateTemplate } from "@/server/services/templates";
import { getCurrentUserWithOrganization } from "@/server/services/current-user";

export const dynamic = "force-dynamic";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export default async function TemplatesPage() {
  const user = await getCurrentUserWithOrganization();

  const templates: JobTemplate[] = user?.organizationId
    ? await prisma.jobTemplate.findMany({
        where: { organizationId: user.organizationId },
        orderBy: { updatedAt: "desc" },
      })
    : [];

  return (
    <main className="flex-1 bg-background">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">
              Templates
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
              Job templates
            </h1>
            <p className="text-sm text-muted-foreground">
              Save role defaults, screening questions, and pipeline stages for repeated hiring.
            </p>
          </div>
          <form action={createTemplate}>
            <Button type="submit">
              <Plus className="h-4 w-4" />
              New template
            </Button>
          </form>
        </header>

        {templates.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-muted/20 p-10 text-center">
            <FilePlus2 className="mx-auto h-9 w-9 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">
              No templates yet. Create one to reuse a role setup across future jobs.
            </p>
            <form action={createTemplate} className="mt-4">
              <Button type="submit">Create template</Button>
            </form>
          </div>
        ) : (
          <div className="overflow-hidden rounded-3xl border border-border/70 bg-card shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-medium">Template</th>
                  <th className="px-5 py-3 font-medium">Role defaults</th>
                  <th className="px-5 py-3 font-medium">Stages</th>
                  <th className="px-5 py-3 font-medium">Updated</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {templates.map((template) => (
                  <tr key={template.id} className="hover:bg-muted/20">
                    <td className="px-5 py-4">
                      <div className="font-medium text-slate-950">{template.name}</div>
                      <div className="mt-0.5 max-w-md truncate text-xs text-muted-foreground">
                        {template.description ?? "No description"}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-700">
                      <div>{template.title}</div>
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        {[template.location, template.type].filter(Boolean).join(" / ") ||
                          "No location or type"}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-700">{template.stageNames.length}</td>
                    <td className="px-5 py-4 text-muted-foreground">
                      {formatDate(template.updatedAt)}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/admin/jobs/new?template=${template.id}`}>
                            Use template
                          </Link>
                        </Button>
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/admin/templates/${template.id}`}>
                            <Pencil className="h-4 w-4" />
                            Edit
                          </Link>
                        </Button>
                        <form action={duplicateTemplate.bind(null, template.id)}>
                          <Button variant="ghost" size="sm">
                            <Copy className="h-4 w-4" />
                          </Button>
                        </form>
                        <form action={deleteTemplate.bind(null, template.id)}>
                          <Button variant="ghost" size="sm" className="hover:text-red-600 hover:bg-red-50">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <section className="rounded-2xl border border-border/70 bg-muted/30 p-5 text-sm text-muted-foreground">
          Applying a template copies its fields and stages into the new job. Later template edits do
          not change existing jobs.
        </section>
      </div>
    </main>
  );
}
