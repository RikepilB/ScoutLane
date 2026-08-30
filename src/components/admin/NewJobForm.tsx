"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  FileText,
  Link2,
  Loader2,
  MapPin,
  Rocket,
  Settings2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { slugify } from "@/lib/slug/slugify";
import { jobCreationSchema } from "@/schemas/job";
import { createJob } from "@/server/services/jobs/create";
import type { ParsedJobPosting } from "@/lib/jobs/parseJobFromUrl";
import { NewJobRoleStep } from "./NewJobRoleStep";
import { NewJobDetailsStep } from "./NewJobDetailsStep";
import { NewJobLaunchStep } from "./NewJobLaunchStep";

type FormValues = z.input<typeof jobCreationSchema>;

interface NewJobFormProps {
  initialValues?: Partial<FormValues>;
  templateId?: string;
  templateName?: string;
}

const steps = [
  {
    id: "role",
    title: "Role",
    description: "Name the role and define the public description.",
    icon: FileText,
  },
  {
    id: "details",
    title: "Details",
    description: "Add location, type, compensation, and public URL.",
    icon: MapPin,
  },
  {
    id: "launch",
    title: "Launch",
    description: "Choose the initial status and confirm the setup.",
    icon: Rocket,
  },
] as const;

export function NewJobForm({ initialValues, templateId, templateName }: NewJobFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [isPending, startTransition] = useTransition();
  const previousAutoSlug = useRef("");
  const [importUrl, setImportUrl] = useState("");
  const [isImporting, setIsImporting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(jobCreationSchema),
    defaultValues: {
      title: initialValues?.title ?? "",
      description: initialValues?.description ?? "",
      location: initialValues?.location ?? "",
      type: initialValues?.type ?? "",
      salary: initialValues?.salary ?? "",
      status: "draft",
      slug: "",
      templateId,
      department: initialValues?.department ?? "",
      whatYouWillDo: initialValues?.whatYouWillDo ?? "",
      requirements: initialValues?.requirements ?? "",
      toolsAndSkills: initialValues?.toolsAndSkills ?? "",
    },
  });

  const watchedTitle = form.watch("title");
  const watchedDescription = form.watch("description");
  const watchedLocation = form.watch("location");
  const watchedType = form.watch("type");
  const watchedSalary = form.watch("salary");
  const watchedStatus = form.watch("status");
  const watchedSlug = form.watch("slug");
  const watchedDepartment = form.watch("department");

  useEffect(() => {
    const current = form.getValues("slug");
    const nextAutoSlug = slugify(watchedTitle).slice(0, 60);
    if (!current || current === previousAutoSlug.current) {
      form.setValue("slug", nextAutoSlug);
      previousAutoSlug.current = nextAutoSlug;
    }
  }, [form, watchedTitle]);

  async function handleImportFromUrl() {
    if (!importUrl.trim()) return;
    setIsImporting(true);
    try {
      const res = await fetch("/api/admin/jobs/import-from-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: importUrl.trim() }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(body?.error ?? "Could not import that job posting.");
        return;
      }
      const job = body.job as ParsedJobPosting;
      const fieldMap: Array<[keyof ParsedJobPosting, keyof FormValues]> = [
        ["title", "title"],
        ["description", "description"],
        ["location", "location"],
        ["type", "type"],
        ["salary", "salary"],
        ["department", "department"],
        ["whatYouWillDo", "whatYouWillDo"],
        ["requirements", "requirements"],
        ["toolsAndSkills", "toolsAndSkills"],
      ];
      let filledCount = 0;
      for (const [fromKey, toKey] of fieldMap) {
        const value = job[fromKey];
        if (value) {
          form.setValue(toKey, value, { shouldValidate: false, shouldDirty: true });
          filledCount += 1;
        }
      }
      if (filledCount === 0) {
        toast.warning("Couldn't find job details on that page — fill the form in manually.");
      } else {
        toast.success(`Imported ${filledCount} field${filledCount === 1 ? "" : "s"} from the page. Review before creating.`);
        setStep(0);
      }
    } catch {
      toast.error("Could not import that job posting. Check your connection.");
    } finally {
      setIsImporting(false);
    }
  }

  async function goNext() {
    const valid = await form.trigger(
      step === 0 ? ["title", "description"] : ["location", "type", "salary", "slug"],
    );
    if (valid) setStep((current) => Math.min(current + 1, steps.length - 1));
  }

  const handleSubmit = form.handleSubmit((values) => {
    setError(null);

    const formData = new FormData();
    formData.set("title", values.title);
    formData.set("description", values.description ?? "");
    formData.set("status", values.status ?? "draft");
    if (values.department) formData.set("department", values.department);
    if (values.whatYouWillDo) formData.set("whatYouWillDo", values.whatYouWillDo);
    if (values.requirements) formData.set("requirements", values.requirements);
    if (values.toolsAndSkills) formData.set("toolsAndSkills", values.toolsAndSkills);
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

  const activeStep = steps[step];
  const ActiveIcon = activeStep.icon;

  return (
    <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
      {error ? (
        <div className="m-6 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {templateName ? (
        <div className="mx-6 mt-6 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
          Starting from template: <span className="font-medium">{templateName}</span>
        </div>
      ) : (
        <div className="mx-6 mt-6 rounded-xl border border-border/70 bg-slate-50 px-4 py-3">
          <div className="flex items-center gap-1.5 text-sm font-medium text-slate-900">
            <Link2 className="h-4 w-4" />
            Import from a job posting URL
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Paste a public job listing and we&apos;ll pre-fill the form below for you to review.
          </p>
          <div className="mt-2 flex gap-2">
            <Input
              type="url"
              placeholder="https://example.com/careers/senior-engineer"
              value={importUrl}
              onChange={(e) => setImportUrl(e.target.value)}
              disabled={isImporting}
              className="bg-white"
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleImportFromUrl}
              disabled={isImporting || !importUrl.trim()}
            >
              {isImporting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Import
            </Button>
          </div>
        </div>
      )}

      <Form {...form}>
        <form onSubmit={handleSubmit}>
          <input type="hidden" {...form.register("templateId")} />
          <div className="grid gap-0 lg:grid-cols-[260px_1fr]">
            <aside className="border-b border-border/70 bg-slate-50 p-5 lg:border-b-0 lg:border-r">
              <div className="mb-5 flex items-center gap-2 text-sm font-semibold text-slate-900">
                <Settings2 className="h-4 w-4" />
                Job setup
              </div>
              <div className="space-y-2">
                {steps.map((item, index) => {
                  const Icon = item.icon;
                  const isActive = index === step;
                  const isDone = index < step;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setStep(index)}
                      className={`flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition ${
                        isActive ? "bg-slate-950 text-white" : "text-slate-700 hover:bg-white"
                      }`}
                    >
                      <span
                        className={`mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                          isActive
                            ? "bg-white text-slate-950"
                            : isDone
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {isDone ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                      </span>
                      <span>
                        <span className="block text-sm font-semibold">{item.title}</span>
                        <span
                          className={`mt-0.5 block text-xs leading-5 ${
                            isActive ? "text-slate-300" : "text-slate-500"
                          }`}
                        >
                          {item.description}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </aside>

            <section className="min-h-[520px] p-6 sm:p-8">
              <div className="mb-6 flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-white">
                  <ActiveIcon className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-lg font-semibold tracking-tight">{activeStep.title}</h2>
                  <p className="text-sm text-muted-foreground">{activeStep.description}</p>
                </div>
              </div>

              {step === 0 ? <NewJobRoleStep control={form.control} /> : null}

              {step === 1 ? (
                <NewJobDetailsStep control={form.control} watchedSlug={watchedSlug} />
              ) : null}

              {step === 2 ? (
                <NewJobLaunchStep
                  control={form.control}
                  watchedTitle={watchedTitle}
                  watchedStatus={watchedStatus}
                  watchedLocation={watchedLocation}
                  watchedType={watchedType}
                  watchedSalary={watchedSalary}
                  watchedSlug={watchedSlug}
                  watchedDescription={watchedDescription}
                />
              ) : null}
            </section>
          </div>

          <div className="flex items-center justify-between border-t border-border/70 px-6 py-4">
            <Link
              href={templateId ? "/admin/templates" : "/admin/jobs"}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4" />
              {templateId ? "Back to templates" : "Back to jobs"}
            </Link>
            <div className="flex items-center gap-2">
              {step > 0 ? (
                <Button type="button" variant="outline" onClick={() => setStep((current) => current - 1)}>
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
              ) : null}
              {step < steps.length - 1 ? (
                <Button type="button" onClick={goNext}>
                  Next
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button type="submit" disabled={isPending}>
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Create job
                </Button>
              )}
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
