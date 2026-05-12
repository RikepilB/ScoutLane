"use client";

import { useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { createJob } from "@/server/services/jobs";
import { type JobCreationInput, jobCreationSchema, jobStatusValues } from "@/schemas/job";
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

export function NewJobForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<JobCreationInput>({
    resolver: zodResolver(jobCreationSchema),
    defaultValues: {
      title: "",
      description: "",
      status: "draft",
    },
  });

  const handleSubmit = form.handleSubmit((values) => {
    setError(null);

    const formData = new FormData();
    formData.set("title", values.title);
    formData.set("description", values.description);
    formData.set("status", values.status);

    startTransition(async () => {
      const result = await createJob(formData);

      if (!result.success) {
        setError(result.error ?? "Could not create the job.");
        return;
      }

      router.push("/admin");
      router.refresh();
    });
  });

  return (
    <div className="rounded-3xl border border-border/70 bg-background p-6 shadow-sm sm:p-8">
      {error ? (
        <div className="mb-4 rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <Form {...form}>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Job title</FormLabel>
                <FormControl>
                  <Input placeholder="Full-Stack Developer" {...field} />
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

          <Button type="submit" disabled={isPending}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Create job
          </Button>
        </form>
      </Form>
    </div>
  );
}
