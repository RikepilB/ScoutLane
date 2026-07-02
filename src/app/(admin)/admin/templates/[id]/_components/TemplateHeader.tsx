import Link from "next/link";
import { ArrowLeft, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TemplatePreviewTrigger } from "./TemplatePreview";
import type { TemplateData } from "./template-data";

interface TemplateHeaderProps {
  template: TemplateData;
  deleteAction: (formData: FormData) => void;
}

export function TemplateHeader({ template, deleteAction }: TemplateHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="space-y-1">
        <Button asChild variant="ghost" size="sm" className="-ml-3">
          <Link href="/admin/templates">
            <ArrowLeft className="h-4 w-4" />
            Templates
          </Link>
        </Button>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
              Edit template
            </h1>
            <p className="text-sm text-muted-foreground">
              Update reusable defaults for future jobs created from this template.
            </p>
          </div>
          <TemplatePreviewTrigger template={template} />
        </div>
      </div>
      <form action={deleteAction}>
        <Button type="submit" variant="outline">
          <Trash2 className="h-4 w-4" />
          Delete
        </Button>
      </form>
    </div>
  );
}
