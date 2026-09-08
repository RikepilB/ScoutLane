"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Sparkles, Upload, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { submitJobApplication } from "@/server/services/submit-job-application";
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

interface CustomField {
  id: string;
  label: string;
  options?: string[];
  type: "text" | "textarea" | "select" | "file";
  required: boolean;
}

interface ApplicationFormProps {
  jobSlug: string;
  customFields?: CustomField[];
}

export function ApplicationForm({ jobSlug, customFields = [] }: ApplicationFormProps) {
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [customValues, setCustomValues] = useState<Record<string, string>>({});
  const [customFiles, setCustomFiles] = useState<Record<string, File>>({});
  const [fitCheck, setFitCheck] = useState<
    | { status: "idle" }
    | { status: "loading" }
    | { status: "done"; score: number; rationale: string; matchedSkills: string[] }
    | { status: "error"; message: string }
  >({ status: "idle" });

  const form = useForm<JobApplicationInput>({
    resolver: zodResolver(jobApplicationSchema),
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
      phone: "",
    },
  });

  const lastDuplicateEmailRef = useRef<string | null>(null);
  const watchedEmail = form.watch("email");

  useEffect(() => {
    const dup = lastDuplicateEmailRef.current;
    if (
      dup &&
      typeof watchedEmail === "string" &&
      watchedEmail.trim().toLowerCase() !== dup
    ) {
      form.clearErrors("email");
      lastDuplicateEmailRef.current = null;
    }
  }, [watchedEmail, form]);

  function updateCustomValue(id: string, value: string) {
    setCustomValues((prev) => ({ ...prev, [id]: value }));
  }

  async function handleCheckFit() {
    const file = form.getValues("resumeFile");
    if (!(file instanceof File)) return;

    setFitCheck({ status: "loading" });
    try {
      const fitFormData = new FormData();
      fitFormData.set("resumeFile", file);
      const res = await fetch(`/api/public/jobs/${jobSlug}/fit-check`, {
        method: "POST",
        body: fitFormData,
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        setFitCheck({ status: "error", message: body?.error ?? "Could not check your fit right now." });
        return;
      }
      setFitCheck({
        status: "done",
        score: body.score,
        rationale: body.rationale,
        matchedSkills: body.matchedSkills ?? [],
      });
    } catch {
      setFitCheck({ status: "error", message: "Could not check your fit right now." });
    }
  }

  const handleSubmit = form.handleSubmit((values) => {
    setServerError(null);
    setSuccessMessage(null);
    setWarningMessage(null);

    const missingCustomField = customFields.find((field) => {
      if (!field.required) return false;
      if (field.type === "file") {
        const file = customFiles[field.id];
        return !(file instanceof File) || file.size === 0;
      }
      const value = customValues[field.id];
      return typeof value !== "string" || value.trim().length === 0;
    });
    if (missingCustomField) {
      setServerError(`${missingCustomField.label} is required.`);
      return;
    }

    const formData = new FormData();
    formData.set("jobSlug", jobSlug);
    formData.set("firstName", values.firstName);
    formData.set("lastName", values.lastName);
    formData.set("email", values.email);
    formData.set("phone", values.phone);
    formData.set("resumeFile", values.resumeFile);
    formData.set("customFields", JSON.stringify(customValues));
    for (const [fieldId, file] of Object.entries(customFiles)) {
      formData.set(`customFile:${fieldId}`, file);
    }

    startTransition(async () => {
      const result = await submitJobApplication(formData);

      if (!result.success) {
        const message = result.error ?? "Could not submit your application.";
        if (result.field === "email") {
          lastDuplicateEmailRef.current = values.email.trim().toLowerCase();
          form.setError(
            "email",
            { type: "server", message },
            { shouldFocus: true },
          );
          return;
        }
        if (result.field === "resumeFile") {
          form.setError(
            "resumeFile",
            { type: "server", message },
            { shouldFocus: true },
          );
          return;
        }
        setServerError(message);
        return;
      }

      form.reset();
      setCustomValues({});
      setCustomFiles({});
      setSuccessMessage("Application submitted successfully.");
      setWarningMessage(result.warning ?? null);
    });
  });

  return (
    <div className="rounded-2xl border border-mist bg-surface p-6 text-ink-900 shadow-[0_18px_50px_rgba(9,21,64,0.14)] sm:p-7">
      <div className="mb-6 space-y-2">
        <h2 className="text-[24px] font-semibold tracking-[-0.015em] text-ink-900">
          Apply for this role
        </h2>
        <p className="text-sm leading-6 text-ink-700">
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
        <div className="mb-4 rounded-2xl border border-success bg-success-soft px-4 py-3 text-sm text-success">
          {successMessage}
        </div>
      ) : null}

      {warningMessage ? (
        <div className="mb-4 rounded-2xl border border-warning bg-warning-soft px-4 py-3 text-sm text-warning">
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
                  <FormLabel className="text-ink-800">First name</FormLabel>
                  <FormControl>
                    <Input className="h-11 border-mist bg-surface text-ink-900 placeholder:text-steel focus-visible:ring-brand-royal" placeholder="Jane" {...field} />
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
                  <FormLabel className="text-ink-800">Last name</FormLabel>
                  <FormControl>
                    <Input className="h-11 border-mist bg-surface text-ink-900 placeholder:text-steel focus-visible:ring-brand-royal" placeholder="Doe" {...field} />
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
                <FormLabel className="text-ink-800">Email</FormLabel>
                <FormControl>
                  <Input className="h-11 border-mist bg-surface text-ink-900 placeholder:text-steel focus-visible:ring-brand-royal" type="email" placeholder="jane@example.com" {...field} />
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
                <FormLabel className="text-ink-800">Phone</FormLabel>
                <FormControl>
                  <Input className="h-11 border-mist bg-surface text-ink-900 placeholder:text-steel focus-visible:ring-brand-royal" placeholder="+1 555 123 4567" {...field} />
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
                <FormLabel className="text-ink-800">Resume</FormLabel>
                <FormControl>
                  <div className="rounded-xl border border-dashed border-soft bg-surface px-4 py-5">
                    {value instanceof File ? (
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-2 text-sm text-ink-900">
                          <Upload className="h-4 w-4 shrink-0 text-brand-slate" />
                          <span className="truncate">{value.name}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            form.resetField("resumeFile");
                            setFitCheck({ status: "idle" });
                          }}
                          className="rounded-lg p-1 text-steel hover:bg-danger-soft hover:text-danger"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <Input
                          {...field}
                          type="file"
                          accept=".pdf,.doc,.docx,.csv,.txt"
                          className="h-11 border-mist bg-surface text-ink-900 file:text-ink-900"
                          onChange={(event) => {
                            onChange(event.target.files?.[0]);
                            setFitCheck({ status: "idle" });
                          }}
                        />
                        <div className="mt-3 flex items-center gap-2 text-xs text-ink-700">
                          <Upload className="h-3.5 w-3.5" />
                          PDF, DOC, DOCX, TXT, or CSV up to 5 MB
                        </div>
                      </>
                    )}
                  </div>
                </FormControl>
                <FormMessage />

                {value instanceof File ? (
                  <div className="mt-2">
                    {fitCheck.status === "idle" ? (
                      <button
                        type="button"
                        onClick={handleCheckFit}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-royal hover:underline"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        Check your fit for this role
                      </button>
                    ) : null}
                    {fitCheck.status === "loading" ? (
                      <p className="inline-flex items-center gap-1.5 text-xs text-ink-700">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Checking your fit…
                      </p>
                    ) : null}
                    {fitCheck.status === "error" ? (
                      <p className="text-xs text-warning">{fitCheck.message}</p>
                    ) : null}
                    {fitCheck.status === "done" ? (
                      <div className="rounded-xl border border-mist bg-surface px-3 py-2.5 text-xs text-ink-900">
                        <p className="font-medium">
                          {fitCheck.score >= 0.75
                            ? "Strong fit for this role"
                            : fitCheck.score >= 0.5
                              ? "Good fit for this role"
                              : fitCheck.score >= 0.3
                                ? "Partial fit for this role"
                                : "This role may not be the closest match"}
                        </p>
                        <p className="mt-1 leading-5 text-ink-700">{fitCheck.rationale}</p>
                        <p className="mt-1.5 text-[10px] text-soft">
                          Advisory only — you&apos;re welcome to apply regardless.
                        </p>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </FormItem>
            )}
          />

          {customFields.map((field) => (
            <div key={field.id}>
              <label className="mb-2 block text-sm font-medium text-ink-800">
                {field.label}
                {field.required && <span className="text-destructive ml-1">*</span>}
              </label>
              {field.type === "file" ? (
                <Input
                  type="file"
                  accept=".pdf,.doc,.docx,.csv,.txt"
                  required={field.required}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    setCustomFiles((prev) => {
                      if (!file) {
                        const { [field.id]: _removed, ...rest } = prev;
                        return rest;
                      }
                      return { ...prev, [field.id]: file };
                    });
                  }}
                  className="h-11 border-mist bg-surface text-ink-900 file:text-ink-900"
                />
              ) : field.type === "textarea" ? (
                <textarea
                  required={field.required}
                  value={customValues[field.id] ?? ""}
                  onChange={(e) => updateCustomValue(field.id, e.target.value)}
                  rows={4}
                  className="flex w-full rounded-md border border-mist bg-surface px-3 py-2 text-sm text-ink-900 shadow-sm placeholder:text-steel focus:outline-none focus:ring-1 focus:ring-brand-royal"
                  placeholder={`Enter ${field.label.toLowerCase()}`}
                />
              ) : field.type === "select" ? (
                <select
                  required={field.required}
                  value={customValues[field.id] ?? ""}
                  onChange={(e) => updateCustomValue(field.id, e.target.value)}
                  className="flex h-11 w-full rounded-md border border-mist bg-surface px-3 py-2 text-sm text-ink-900 shadow-sm focus:outline-none focus:ring-1 focus:ring-brand-royal"
                >
                  <option value="">Select...</option>
                  {(field.options ?? []).map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  required={field.required}
                  value={customValues[field.id] ?? ""}
                  onChange={(e) => updateCustomValue(field.id, e.target.value)}
                  className="flex h-11 w-full rounded-md border border-mist bg-surface px-3 py-2 text-sm text-ink-900 shadow-sm placeholder:text-steel focus:outline-none focus:ring-1 focus:ring-brand-royal"
                  placeholder={`Enter ${field.label.toLowerCase()}`}
                />
              )}
            </div>
          ))}

          <Button className="h-11 w-full rounded-lg bg-brand-royal px-5 text-paper shadow-[0_10px_22px_rgba(27,44,193,0.24)] hover:bg-brand-royal-hover sm:w-auto" type="submit" disabled={isPending}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Submit application
          </Button>
        </form>
      </Form>
    </div>
  );
}
