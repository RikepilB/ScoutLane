"use client";

import { useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useApplicationStore } from "@/lib/store/useApplicationStore";
import { applicationSchema, type ApplicationData } from "@/schemas/application";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

interface ApplicationFormProps {
  jobSlug: string;
}

const resolver = zodResolver(applicationSchema);

export function ApplicationForm({ jobSlug }: ApplicationFormProps) {
  const {
    formData,
    isLoading,
    error,
    lastSaved,
    updateField,
    saveDraft,
    submitApplication,
    loadApplication,
    clearForm,
    resetError,
  } = useApplicationStore();

  const form = useForm<ApplicationData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: resolver as any,
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      customFields: [],
      resumeUrl: "",
      status: "draft",
      jobSlug,
    },
    mode: "onBlur",
  });

  useEffect(() => {
    loadApplication(jobSlug);
  }, [jobSlug, loadApplication]);

  useEffect(() => {
    form.reset(formData);
  }, [formData, form]);

  const handleFieldChange = useCallback(
    (name: keyof ApplicationData, value: string) => {
      updateField(name, value);
    },
    [updateField],
  );

  const handleSaveDraft = useCallback(async () => {
    await saveDraft(jobSlug);
  }, [saveDraft, jobSlug]);

  const onSubmit = useCallback(async () => {
    await submitApplication(jobSlug);
  }, [submitApplication, jobSlug]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Submit your application</h1>
        <p className="text-sm text-muted-foreground">
          Your progress is saved automatically. You can return later to finish.
        </p>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
          <button onClick={resetError} className="ml-2 underline">
            Dismiss
          </button>
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Jane"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        handleFieldChange("firstName", e.target.value);
                      }}
                    />
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
                    <Input
                      placeholder="Doe"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        handleFieldChange("lastName", e.target.value);
                      }}
                    />
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
                  <Input
                    type="email"
                    placeholder="jane@company.com"
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                      handleFieldChange("email", e.target.value);
                    }}
                  />
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
                <FormLabel>Phone (optional)</FormLabel>
                <FormControl>
                  <Input
                    placeholder="+1 555 123 4567"
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                      handleFieldChange("phone", e.target.value);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
            <div className="flex items-center gap-3">
              <Button type="button" variant="outline" onClick={handleSaveDraft} disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Save draft
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => clearForm(jobSlug)}>
                Clear
              </Button>
            </div>
            <div className="flex items-center gap-3">
              {lastSaved && (
                <span className="text-xs text-muted-foreground">
                  Saved {lastSaved.toLocaleTimeString()}
                </span>
              )}
              <Button type="submit" disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Submit application
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
