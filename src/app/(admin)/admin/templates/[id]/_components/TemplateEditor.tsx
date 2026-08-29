import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QuestionsEditor } from "./QuestionsEditor";
import { TemplateHeader } from "./TemplateHeader";
import { TemplateJobDefaultsSection } from "./TemplateJobDefaultsSection";
import { TemplateRoleStructureSection } from "./TemplateRoleStructureSection";
import { TemplateCustomFieldsSection } from "./TemplateCustomFieldsSection";
import type { TemplateData } from "./template-data";

interface TemplateEditorProps {
  template: TemplateData;
  updateAction: (formData: FormData) => void;
  deleteAction: (formData: FormData) => void;
}

export function TemplateEditor({
  template,
  updateAction,
  deleteAction,
}: TemplateEditorProps) {
  return (
    <>
      <TemplateHeader template={template} deleteAction={deleteAction} />

      <form
        action={updateAction}
        className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm sm:p-8"
      >
        <div className="space-y-6">
          <section className="space-y-4">
            <div>
              <h2 className="text-base font-semibold tracking-tight">
                Template details
              </h2>
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
                <Input
                  name="description"
                  defaultValue={template.description ?? ""}
                />
              </label>
            </div>
          </section>

          <TemplateJobDefaultsSection template={template} />

          <TemplateRoleStructureSection template={template} />

          {/*
            Pipeline stages are not hand-edited on the template form — they are
            managed per job in the pipeline view. The template's stage set is
            preserved on save via this hidden field so existing stages are not
            dropped when the template is updated.
          */}
          <input
            type="hidden"
            name="stageNames"
            value={template.stageNames.join("\n")}
          />

          <section>
            <QuestionsEditor defaultValue={template.questions as string[]} />
          </section>

          <TemplateCustomFieldsSection initialCustomFields={template.customFields} />
        </div>

        <div className="mt-8 flex justify-end">
          <Button type="submit">
            <Save className="h-4 w-4" />
            Save template
          </Button>
        </div>
      </form>
    </>
  );
}
