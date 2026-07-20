import { Textarea } from "@/components/ui/textarea";
import { DEPARTMENTS } from "@/lib/jobs/departments";
import type { TemplateData } from "./template-data";

interface TemplateRoleStructureSectionProps {
  template: TemplateData;
}

export function TemplateRoleStructureSection({ template }: TemplateRoleStructureSectionProps) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-base font-semibold tracking-tight">Role structure</h2>
        <p className="text-sm text-muted-foreground">
          These fields define structured sections on the public job page.
        </p>
      </div>

      <label className="space-y-2 text-sm font-medium">
        Department
        <select
          name="department"
          defaultValue={template.department ?? ""}
          className="flex h-10 w-full rounded-md border border-border/70 bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <option value="">None</option>
          {DEPARTMENTS.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </label>

      <label className="space-y-2 text-sm font-medium">
        What you&apos;ll do
        <Textarea
          name="whatYouWillDo"
          className="min-h-28"
          defaultValue={template.whatYouWillDo ?? ""}
          placeholder="Describe the day-to-day responsibilities. Markdown supported."
        />
      </label>

      <label className="space-y-2 text-sm font-medium">
        Requirements (one per line)
        <Textarea
          name="requirements"
          className="min-h-24"
          defaultValue={(template.requirements ?? []).join("\n")}
          placeholder="3+ years with React and TypeScript&#10;Experience with PostgreSQL&#10;Strong CS fundamentals"
        />
      </label>

      <label className="space-y-2 text-sm font-medium">
        Tools &amp; Skills (one per line)
        <Textarea
          name="toolsAndSkills"
          className="min-h-24"
          defaultValue={(template.toolsAndSkills ?? []).join("\n")}
          placeholder="React&#10;TypeScript&#10;PostgreSQL&#10;Docker"
        />
      </label>
    </section>
  );
}
