"use client";

import { useTransition, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { updateJob } from "@/server/services/jobs/update";
import { getJobPersistence } from "@/lib/jobs/status";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { jobEditSchema, type EditJobFormValues } from "./job-edit-schema";
import { EditJobBreadcrumb } from "./EditJobBreadcrumb";
import { EditJobDescriptionField } from "./EditJobDescriptionField";
import { EditJobDetailsFields } from "./EditJobDetailsFields";

interface EditJobFormProps {
  jobId: string;
  initialData: Pick<
    EditJobFormValues,
    "title" | "description" | "descriptionUrl" | "location" | "type" | "salary" | "slug" | "department" | "whatYouWillDo" | "requirements" | "toolsAndSkills"
  >;
  currentStatus: EditJobFormValues["status"];
}

export function EditJobForm({
  jobId,
  initialData,
  currentStatus,
}: EditJobFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<EditJobFormValues>({
    resolver: zodResolver(jobEditSchema),
    defaultValues: {
      ...initialData,
      status: currentStatus,
    },
  });

  const [descMode, setDescMode] = useState<"write" | "link">(
    initialData.descriptionUrl ? "link" : "write",
  );

  const handleSubmit = form.handleSubmit((values) => {
    setError(null);
    const persistence = getJobPersistence(values.status);

    startTransition(async () => {
      const result = await updateJob(jobId, {
        title: values.title,
        description: descMode === "link" ? undefined : values.description || undefined,
        descriptionUrl: descMode === "link" ? values.descriptionUrl || undefined : undefined,
        location: values.location || undefined,
        type: values.type || undefined,
        salary: values.salary || undefined,
        slug: values.slug,
        department: values.department || undefined,
        whatYouWillDo: values.whatYouWillDo || undefined,
        requirements: values.requirements
          ? values.requirements.split("\n").map((s) => s.trim()).filter(Boolean)
          : undefined,
        toolsAndSkills: values.toolsAndSkills
          ? values.toolsAndSkills.split("\n").map((s) => s.trim()).filter(Boolean)
          : undefined,
        published: persistence.published,
        archived: persistence.archived,
      });

      if (!result.success) {
        setError(result.error ?? "Could not update the job.");
        return;
      }

      router.push(`/admin/jobs/${jobId}`);
      router.refresh();
    });
  });

  return (
    <div className="space-y-6">
      <EditJobBreadcrumb jobId={jobId} title={initialData.title} />

      {error ? (
        <div className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm sm:p-8">
        <Form {...form}>
          <form className="space-y-5" onSubmit={handleSubmit}>
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job title</FormLabel>
                  <FormControl>
                    <Input placeholder="Senior Frontend Engineer" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <EditJobDescriptionField
              control={form.control}
              descMode={descMode}
              setDescMode={setDescMode}
            />

            <EditJobDetailsFields control={form.control} />

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" asChild>
                <Link href={`/admin/jobs/${jobId}`}>Cancel</Link>
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Save changes
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
