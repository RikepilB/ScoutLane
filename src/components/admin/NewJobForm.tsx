"use client";

import { useEffect, useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { createJob } from "@/server/services/jobs/create";
import { jobCreationSchema, jobStatusValues } from "@/schemas/job";
import { slugify } from "@/lib/slug/slugify";

type FormValues = z.input<typeof jobCreationSchema>;
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
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

interface NewJobFormProps {
  initialValues?: Partial<FormValues>;
  templateId?: string;
  templateName?: string;
}

export function NewJobForm({ initialValues, templateId, templateName }: NewJobFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<FormValues>({
    resolver: zodResolver(jobCreationSchema),
    defaultValues: {
      title: initialValues?.title ?? "",
      description: initialValues?.description ?? "",
      location: initialValues?.location ?? "",
      type: initialValues?.type ?? "",
      salary: initialValues?.salary ?? "",
      status: "draft",
      templateId,
    },
  });

  const watchedTitle = form.watch("title");

  function autoFillSlug(title: string) {
    const current = form.getValues("slug");
    if (!current || current === slugify(form.getValues("title")).slice(0, 60)) {
      form.setValue("slug", slugify(title).slice(0, 60));
    }
  }

  useEffect(() => {
    autoFillSlug(watchedTitle);
  }, [watchedTitle]);

  const handleSubmit = form.handleSubmit((values) => {
    setError(null);

    const formData = new FormData();
    formData.set("title", values.title);
    formData.set("description", values.description ?? "");
    formData.set("status", values.status ?? "draft");
    if (values.location) formData.set("location", values.location);
    if (values.type) formData.set("type", values.type);
    if (values.salary) formData.set("salary", values.salary);
    if (values.templateId) formData.set("templateId", values.templateId);
    if (values.slug) formData.set("slug", values.slug);

    startTransition(async () => {
      const result = await createJob(formData);

      if (!result.success) {
        setError(result.error ?? "Could not create the job.");
        return;
      }

      router.push("/admin/jobs");
      router.refresh();
    });
  });

  return (
    <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm sm:p-8">
      {error ? (
        <div className="mb-4 rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}
      {templateName ? (
        <div className="mb-4 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
          Starting from template: {templateName}
        </div>
      ) : null}

      <Form {...form}>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <input type="hidden" {...form.register("templateId")} />
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
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input placeholder="Remote · Lima · Hybrid" {...field} />
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
                    <Input placeholder="Full-time, Contract, Part-time…" {...field} />
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
                  <Input placeholder="senior-frontend-engineer" {...field} />
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
                    <Input placeholder="$80k–$120k, Negotiable, etc." {...field} />
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
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <Link
              href={templateId ? "/admin/templates" : "/admin/jobs"}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4" />
              {templateId ? "Back to templates" : "Back to jobs"}
            </Link>
            <Button type="submit" disabled={isPending}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Create job
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
