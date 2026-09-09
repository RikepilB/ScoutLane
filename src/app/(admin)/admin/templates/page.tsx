import Link from "next/link";
import { FilePlus2, Pencil, Trash2 } from "lucide-react";
import type { JobTemplate } from "@/generated/prisma/client";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db/prisma";
import { deleteTemplate } from "@/server/services/templates";
import { NewTemplateButton } from "./_components/NewTemplateButton";
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
    <div className="min-w-0 flex-1 bg-paper">
      <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-5 px-4 py-6 sm:px-8 sm:py-8">
        {/* Page header */}
        <header className="animate-fade-up flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.16em] text-steel"
              style={{ fontFamily: "var(--font-mono)" }}>
              Templates
            </p>
            <h1 className="text-[32px] tracking-[-0.02em] text-ink-900"
              style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}>
              Job templates
            </h1>
            <p className="text-[13.5px] text-steel">
              Save role defaults, screening questions, and pipeline stages for repeated hiring.
            </p>
          </div>
          <NewTemplateButton />
        </header>

        {templates.length === 0 ? (
          <div className="animate-fade-up animate-fade-up-delay-1 rounded-2xl border border-dashed border-mist bg-surface p-10 text-center">
            <FilePlus2 className="mx-auto h-9 w-9 text-steel" />
            <p className="mt-3 text-[13px] text-steel">
              No templates yet. Create one to reuse a role setup across future jobs.
            </p>
            <div className="mt-4">
              <NewTemplateButton label="Create template" />
            </div>
          </div>
        ) : (
          <div className="animate-fade-up animate-fade-up-delay-1 overflow-x-auto rounded-card border border-mist bg-surface shadow-[0_1px_3px_rgba(9,21,64,0.06),0_1px_2px_rgba(9,21,64,0.04)]">
            <table className="w-full text-[13.5px]">
              <thead>
                <tr className="border-b border-mist">
                  <th className="px-4 py-2.5 text-left text-[10.5px] font-semibold uppercase tracking-[0.10em] text-steel"
                    style={{ fontFamily: "var(--font-mono)" }}>
                    Template
                  </th>
                  <th className="px-4 py-2.5 text-left text-[10.5px] font-semibold uppercase tracking-[0.10em] text-steel"
                    style={{ fontFamily: "var(--font-mono)" }}>
                    Role defaults
                  </th>
                  <th className="px-4 py-2.5 text-left text-[10.5px] font-semibold uppercase tracking-[0.10em] text-steel"
                    style={{ fontFamily: "var(--font-mono)" }}>
                    Stages
                  </th>
                  <th className="px-4 py-2.5 text-left text-[10.5px] font-semibold uppercase tracking-[0.10em] text-steel"
                    style={{ fontFamily: "var(--font-mono)" }}>
                    Updated
                  </th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {templates.map((template) => (
                  <tr key={template.id} className="border-b border-[rgba(9,21,64,0.06)] transition-colors hover:bg-paper">
                    <td className="px-4 py-3.5">
                      <div className="text-[13.5px] font-medium text-ink-900">{template.name}</div>
                      <div className="mt-0.5 max-w-md truncate text-[12px] text-steel">
                        {template.description ?? "No description"}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-[13px] text-ink-700">
                      <div>{template.title}</div>
                      <div className="mt-0.5 text-[12px] text-steel">
                        {[template.location, template.type].filter(Boolean).join(" / ") ||
                          "No location or type"}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-[13px] text-ink-700">{template.stageNames.length}</td>
                    <td className="px-4 py-3.5 text-[13px] text-brand-royal">
                      {formatDate(template.updatedAt)}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex justify-end gap-1.5">
                        <Button asChild variant="outline" size="sm" className="h-[30px] rounded-md border-mist text-[12px] text-ink-900">
                          <Link href={`/admin/jobs/new?template=${template.id}`}>
                            Use template
                          </Link>
                        </Button>
                        <Button asChild variant="ghost" size="sm" className="h-[30px] rounded-md text-[12px]">
                          <Link href={`/admin/templates/${template.id}`}>
                            <Pencil className="h-3.5 w-3.5" />
                            Edit
                          </Link>
                        </Button>
                        <form action={deleteTemplate.bind(null, template.id)}>
                          <Button
                            variant="ghost"
                            size="sm"
                             className="h-[30px] rounded-md text-[12px] text-steel hover:bg-danger-soft hover:text-danger"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </Button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="border-t border-[rgba(9,21,64,0.06)] px-4 py-3.5">
              <p className="text-[13px] text-brand-royal">
                Applying a template copies its fields and stages into the new job. Later template edits do not change existing jobs.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
