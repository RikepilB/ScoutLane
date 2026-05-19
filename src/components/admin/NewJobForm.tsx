"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  FileText,
  Loader2,
  MapPin,
  Rocket,
  Settings2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import type { z } from "zod";
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
import { slugify } from "@/lib/slug/slugify";
import { DEPARTMENTS } from "@/lib/jobs/departments";
import { jobCreationSchema, jobStatusValues } from "@/schemas/job";
import { createJob } from "@/server/services/jobs/create";

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
  const watchedWhatYouWillDo = form.watch("whatYouWillDo");
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
      ) : null}

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

              {step === 0 ? (
                <div className="space-y-5">
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
                            className="min-h-32"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-blue-700 mb-4">
                      Structured sections (appear on public job page)
                    </p>

                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="whatYouWillDo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>What you&apos;ll do</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Describe the day-to-day responsibilities. Markdown supported."
                                className="min-h-28"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="requirements"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Requirements (one per line)</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder={`3+ years with React and TypeScript
Experience with Node.js and PostgreSQL
Strong CS fundamentals`}
                                className="min-h-24"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="toolsAndSkills"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tools &amp; Skills (one per line)</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder={`React\nTypeScript\nNext.js\nDocker\nAWS`}
                                className="min-h-24"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>
              ) : null}

              {step === 1 ? (
                <div className="space-y-5">
                  <FormField
                    control={form.control}
                    name="department"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Department</FormLabel>
                        <FormControl>
                          <select
                            {...field}
                            className="flex h-10 w-full rounded-md border border-border/70 bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                          >
                            <option value="">None</option>
                            {DEPARTMENTS.map((d) => (
                              <option key={d} value={d}>
                                {d}
                              </option>
                            ))}
                          </select>
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
                            <Input placeholder="Remote, Lima, Hybrid" {...field} />
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
                            <Input placeholder="Full-time, Contract, Part-time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="salary"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Salary</FormLabel>
                          <FormControl>
                            <Input placeholder="$80k-$120k, Negotiable, etc." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

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
                  </div>

                  <div className="rounded-xl border border-border/70 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Public URL
                    </p>
                    <p className="mt-1 break-all text-sm font-medium text-slate-900">
                      /careers/{watchedSlug || "job-slug"}
                    </p>
                  </div>
                </div>
              ) : null}

              {step === 2 ? (
                <div className="space-y-5">
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <FormControl>
                          <div className="grid gap-3 sm:grid-cols-3">
                            {jobStatusValues.map((status) => (
                              <label
                                key={status}
                                className={`cursor-pointer rounded-xl border px-4 py-3 text-sm transition ${
                                  field.value === status
                                    ? "border-slate-950 bg-slate-950 text-white"
                                    : "border-border/70 bg-white text-slate-700 hover:bg-slate-50"
                                }`}
                              >
                                <input
                                  type="radio"
                                  className="sr-only"
                                  value={status}
                                  checked={field.value === status}
                                  onChange={() => field.onChange(status)}
                                />
                                <span className="font-semibold capitalize">{status}</span>
                                <span
                                  className={`mt-1 block text-xs ${
                                    field.value === status ? "text-slate-300" : "text-slate-500"
                                  }`}
                                >
                                  {status === "draft"
                                    ? "Keep private while configuring."
                                    : status === "active"
                                      ? "Publish and accept applicants."
                                      : "Keep data but close intake."}
                                </span>
                              </label>
                            ))}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="rounded-xl border border-border/70 bg-slate-50 p-5">
                    <h3 className="text-sm font-semibold text-slate-900">Review</h3>
                    <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                      <div>
                        <dt className="text-xs uppercase tracking-wide text-slate-500">Title</dt>
                        <dd className="mt-1 font-medium text-slate-900">
                          {watchedTitle || "Untitled job"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs uppercase tracking-wide text-slate-500">Status</dt>
                        <dd className="mt-1 font-medium capitalize text-slate-900">
                          {watchedStatus}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs uppercase tracking-wide text-slate-500">
                          Location
                        </dt>
                        <dd className="mt-1 text-slate-800">{watchedLocation || "Not set"}</dd>
                      </div>
                      <div>
                        <dt className="text-xs uppercase tracking-wide text-slate-500">Type</dt>
                        <dd className="mt-1 text-slate-800">{watchedType || "Not set"}</dd>
                      </div>
                      <div>
                        <dt className="text-xs uppercase tracking-wide text-slate-500">Salary</dt>
                        <dd className="mt-1 text-slate-800">{watchedSalary || "Not set"}</dd>
                      </div>
                      <div>
                        <dt className="text-xs uppercase tracking-wide text-slate-500">Slug</dt>
                        <dd className="mt-1 break-all text-slate-800">
                          {watchedSlug || "Not set"}
                        </dd>
                      </div>
                    </dl>
                    <p className="mt-4 line-clamp-4 text-sm leading-6 text-slate-600">
                      {watchedDescription || "No description yet."}
                    </p>
                  </div>
                </div>
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
