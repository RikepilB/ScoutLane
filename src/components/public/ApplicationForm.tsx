"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Upload, X } from "lucide-react";
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
  type: "text" | "textarea" | "select";
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

  const handleSubmit = form.handleSubmit((values) => {
    setServerError(null);
    setSuccessMessage(null);
    setWarningMessage(null);

    const missingCustomField = customFields.find((field) => {
      if (!field.required) return false;
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
      setSuccessMessage("Application submitted successfully.");
      setWarningMessage(result.warning ?? null);
    });
  });

  return (
    <div className="rounded-2xl border border-[#cbd5e1] bg-white p-6 text-[#0c1529] shadow-[0_18px_50px_rgba(9,21,64,0.14)] sm:p-7">
      <div className="mb-6 space-y-2">
        <h2 className="text-[24px] font-semibold tracking-[-0.015em] text-[#0c1529]">
          Apply for this role
        </h2>
        <p className="text-sm leading-6 text-[#475569]">
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
                  <FormLabel className="text-[#1e293b]">First name</FormLabel>
                  <FormControl>
                    <Input className="h-11 border-[#cbd5e1] bg-white text-[#0c1529] placeholder:text-[#64748b] focus-visible:ring-[#1B2CC1]" placeholder="Jane" {...field} />
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
                  <FormLabel className="text-[#1e293b]">Last name</FormLabel>
                  <FormControl>
                    <Input className="h-11 border-[#cbd5e1] bg-white text-[#0c1529] placeholder:text-[#64748b] focus-visible:ring-[#1B2CC1]" placeholder="Doe" {...field} />
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
                <FormLabel className="text-[#1e293b]">Email</FormLabel>
                <FormControl>
                  <Input className="h-11 border-[#cbd5e1] bg-white text-[#0c1529] placeholder:text-[#64748b] focus-visible:ring-[#1B2CC1]" type="email" placeholder="jane@example.com" {...field} />
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
                <FormLabel className="text-[#1e293b]">Phone</FormLabel>
                <FormControl>
                  <Input className="h-11 border-[#cbd5e1] bg-white text-[#0c1529] placeholder:text-[#64748b] focus-visible:ring-[#1B2CC1]" placeholder="+1 555 123 4567" {...field} />
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
                <FormLabel className="text-[#1e293b]">Resume</FormLabel>
                <FormControl>
                  <div className="rounded-xl border border-dashed border-[#94a3b8] bg-[#f8fafc] px-4 py-5">
                    {value instanceof File ? (
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-2 text-sm text-[#0c1529]">
                          <Upload className="h-4 w-4 shrink-0 text-[#3D518C]" />
                          <span className="truncate">{value.name}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            form.resetField("resumeFile");
                          }}
                          className="rounded-lg p-1 text-[#64748b] hover:bg-red-50 hover:text-red-500"
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
                          className="h-11 border-[#cbd5e1] bg-white text-[#0c1529] file:text-[#0c1529]"
                          onChange={(event) => {
                            onChange(event.target.files?.[0]);
                          }}
                        />
                        <div className="mt-3 flex items-center gap-2 text-xs text-[#475569]">
                          <Upload className="h-3.5 w-3.5" />
                          PDF, DOC, DOCX, TXT, or CSV up to 5 MB
                        </div>
                      </>
                    )}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {customFields.map((field) => (
            <div key={field.id}>
              <label className="mb-2 block text-sm font-medium text-[#1e293b]">
                {field.label}
                {field.required && <span className="text-destructive ml-1">*</span>}
              </label>
              {field.type === "textarea" ? (
                <textarea
                  value={customValues[field.id] ?? ""}
                  onChange={(e) => updateCustomValue(field.id, e.target.value)}
                  rows={4}
                  className="flex w-full rounded-md border border-[#cbd5e1] bg-white px-3 py-2 text-sm text-[#0c1529] shadow-sm placeholder:text-[#64748b] focus:outline-none focus:ring-1 focus:ring-[#1B2CC1]"
                  placeholder={`Enter ${field.label.toLowerCase()}`}
                />
              ) : field.type === "select" ? (
                <select
                  value={customValues[field.id] ?? ""}
                  onChange={(e) => updateCustomValue(field.id, e.target.value)}
                  className="flex h-11 w-full rounded-md border border-[#cbd5e1] bg-white px-3 py-2 text-sm text-[#0c1529] shadow-sm focus:outline-none focus:ring-1 focus:ring-[#1B2CC1]"
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
                  value={customValues[field.id] ?? ""}
                  onChange={(e) => updateCustomValue(field.id, e.target.value)}
                  className="flex h-11 w-full rounded-md border border-[#cbd5e1] bg-white px-3 py-2 text-sm text-[#0c1529] shadow-sm placeholder:text-[#64748b] focus:outline-none focus:ring-1 focus:ring-[#1B2CC1]"
                  placeholder={`Enter ${field.label.toLowerCase()}`}
                />
              )}
            </div>
          ))}

          <Button className="h-11 w-full rounded-lg bg-[#1B2CC1] px-5 text-white shadow-[0_10px_22px_rgba(27,44,193,0.24)] hover:bg-[#2238d6] sm:w-auto" type="submit" disabled={isPending}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Submit application
          </Button>
        </form>
      </Form>
    </div>
  );
}
