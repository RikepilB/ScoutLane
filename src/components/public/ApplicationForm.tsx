"use client";

import { useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Upload } from "lucide-react";
import { useForm } from "react-hook-form";
import { submitJobApplication } from "@/server/services/applications";
import { type JobApplicationInput, jobApplicationSchema } from "@/schemas/application";
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

interface ApplicationFormProps {
  jobSlug: string;
}

export function ApplicationForm({ jobSlug }: ApplicationFormProps) {
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  const form = useForm<JobApplicationInput>({
    resolver: zodResolver(jobApplicationSchema),
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
      phone: "",
    },
  });

  const handleSubmit = form.handleSubmit((values) => {
    setServerError(null);
    setSuccessMessage(null);
    setWarningMessage(null);

    const formData = new FormData();
    formData.set("jobSlug", jobSlug);
    formData.set("firstName", values.firstName);
    formData.set("lastName", values.lastName);
    formData.set("email", values.email);
    formData.set("phone", values.phone);
    formData.set("resumeFile", values.resumeFile);

    startTransition(async () => {
      const result = await submitJobApplication(formData);

      if (!result.success) {
        setServerError(result.error ?? "Could not submit your application.");
        return;
      }

      form.reset();
      setSuccessMessage("Application submitted successfully.");
      setWarningMessage(result.warning ?? null);
    });
  });

  return (
    <div className="rounded-3xl border border-border/70 bg-background/95 p-6 shadow-sm sm:p-8">
      <div className="mb-6 space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">Apply for this role</h2>
        <p className="text-sm text-muted-foreground">
          Submit your details and resume. We will send a confirmation email once your
          application is received.
        </p>
      </div>

      {serverError ? (
        <div className="mb-4 rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {serverError}
        </div>
      ) : null}

      {successMessage ? (
        <div className="mb-4 rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {successMessage}
        </div>
      ) : null}

      {warningMessage ? (
        <div className="mb-4 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {warningMessage}
        </div>
      ) : null}

      <Form {...form}>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First name</FormLabel>
                  <FormControl>
                    <Input placeholder="Jane" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last name</FormLabel>
                  <FormControl>
                    <Input placeholder="Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="jane@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <Input placeholder="+1 555 123 4567" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="resumeFile"
            render={({ field: { onChange, value, ...field } }) => (
              <FormItem>
                <FormLabel>Resume</FormLabel>
                <FormControl>
                  <div className="rounded-2xl border border-dashed border-border bg-muted/30 px-4 py-5">
                    <Input
                      {...field}
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(event) => {
                        onChange(event.target.files?.[0]);
                      }}
                    />
                    <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                      <Upload className="h-3.5 w-3.5" />
                      PDF, DOC, or DOCX up to 5 MB
                    </div>
                    {value instanceof File ? (
                      <div className="mt-2 text-xs text-foreground">{value.name}</div>
                    ) : null}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button className="w-full sm:w-auto" type="submit" disabled={isPending}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Submit application
          </Button>
        </form>
      </Form>
    </div>
  );
}
