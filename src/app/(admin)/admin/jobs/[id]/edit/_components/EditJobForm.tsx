"use client";

import { useTransition, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { z } from "zod";
import { updateJob } from "@/server/services/jobs/update";
import { getJobPersistence } from "@/lib/jobs/status";
import { jobStatusValues, jobStatusSchema } from "@/schemas/job";
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
import { Textarea } from "@/components/ui/textarea";

const jobEditSchema = z.object({
  title: z
    .string()
    .min(3, "Job title must be at least 3 characters")
    .max(120, "Job title must be 120 characters or fewer"),
  description: z
    .string()
    .max(12000, "Job description must be 12000 characters or fewer")
    .optional()
    .or(z.literal("")),
  descriptionUrl: z
    .string()
    .url("Description URL must be a valid URL")
    .max(2000, "URL must be 2000 characters or fewer")
    .optional()
    .or(z.literal("")),
  location: z
    .string()
    .max(120, "Location must be 120 characters or fewer")
    .optional()
    .or(z.literal("")),
  type: z
    .string()
    .max(60, "Type must be 60 characters or fewer")
    .optional()
    .or(z.literal("")),
  salary: z
    .string()
    .max(60, "Salary must be 60 characters or fewer")
    .optional()
    .or(z.literal("")),
  slug: z
    .string()
    .regex(
      /^[a-z0-9-]+$/,
      "Slug can only contain lowercase letters, numbers, and hyphens",
    )
    .min(3, "Slug must be at least 3 characters")
    .max(80, "Slug must be 80 characters or fewer"),
  status: jobStatusSchema,
});

type FormValues = z.infer<typeof jobEditSchema>;

interface EditJobFormProps {
  jobId: string;
  initialData: Pick<
    FormValues,
    "title" | "description" | "descriptionUrl" | "location" | "type" | "salary" | "slug"
  >;
  currentStatus: FormValues["status"];
}

export function EditJobForm({
  jobId,
  initialData,
  currentStatus,
}: EditJobFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<FormValues>({
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
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link
          href="/admin/jobs"
          className="transition-colors hover:text-foreground"
        >
          Jobs
        </Link>
        <span className="text-muted-foreground/40">/</span>
        <Link
          href={`/admin/jobs/${jobId}`}
          className="transition-colors hover:text-foreground"
        >
          {initialData.title}
        </Link>
        <span className="text-muted-foreground/40">/</span>
        <span className="text-foreground">Edit</span>
      </nav>

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

            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium">Description source</span>
                <label className="flex items-center gap-1.5 text-sm">
                  <input
                    type="radio"
                    name="descMode"
                    value="write"
                    checked={descMode === "write"}
                    onChange={() => setDescMode("write")}
                  />
                  Write description
                </label>
                <label className="flex items-center gap-1.5 text-sm">
                  <input
                    type="radio"
                    name="descMode"
                    value="link"
                    checked={descMode === "link"}
                    onChange={() => setDescMode("link")}
                  />
                  Link to hosted PDF/Google Doc
                </label>
              </div>

              {descMode === "link" ? (
                <FormField
                  control={form.control}
                  name="descriptionUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description URL</FormLabel>
                      <FormControl>
                        <Input
                          type="url"
                          placeholder="https://docs.google.com/document/d/..."
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe the role, expectations, and requirements."
                          className="min-h-48"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Remote · Lima · Hybrid"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Full-time, Contract, Part-time…"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL slug</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="senior-frontend-engineer"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-5 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="salary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Salary</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="$80k–$120k, Negotiable, etc."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <FormControl>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                        {...field}
                      >
                        {jobStatusValues.map((status) => (
                          <option key={status} value={status}>
                            {status.charAt(0).toUpperCase() +
                              status.slice(1)}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
