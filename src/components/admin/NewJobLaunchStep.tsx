import type { Control } from "react-hook-form";
import type { z } from "zod";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { jobStatusValues, type jobCreationSchema } from "@/schemas/job";

type FormValues = z.input<typeof jobCreationSchema>;

interface NewJobLaunchStepProps {
  control: Control<FormValues>;
  watchedTitle: string | undefined;
  watchedStatus: string | undefined;
  watchedLocation: string | undefined;
  watchedType: string | undefined;
  watchedSalary: string | undefined;
  watchedSlug: string | undefined;
  watchedDescription: string | undefined;
}

export function NewJobLaunchStep({
  control,
  watchedTitle,
  watchedStatus,
  watchedLocation,
  watchedType,
  watchedSalary,
  watchedSlug,
  watchedDescription,
}: NewJobLaunchStepProps) {
  return (
    <div className="space-y-5">
      <FormField
        control={control}
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
                        ? "border-ink-950 bg-ink-950 text-paper"
                        : "border-border/70 bg-surface text-ink-700 hover:bg-paper"
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
                        field.value === status ? "text-mist" : "text-steel"
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

      <div className="rounded-xl border border-border/70 bg-paper p-5">
        <h3 className="text-sm font-semibold text-ink-900">Review</h3>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wide text-steel">Title</dt>
            <dd className="mt-1 font-medium text-ink-900">
              {watchedTitle || "Untitled job"}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-steel">Status</dt>
            <dd className="mt-1 font-medium capitalize text-ink-900">
              {watchedStatus}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-steel">
              Location
            </dt>
            <dd className="mt-1 text-ink-800">{watchedLocation || "Not set"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-steel">Type</dt>
            <dd className="mt-1 text-ink-800">{watchedType || "Not set"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-steel">Salary</dt>
            <dd className="mt-1 text-ink-800">{watchedSalary || "Not set"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-steel">Slug</dt>
            <dd className="mt-1 break-all text-ink-800">
              {watchedSlug || "Not set"}
            </dd>
          </div>
        </dl>
        <p className="mt-4 line-clamp-4 text-sm leading-6 text-ink-700">
          {watchedDescription || "No description yet."}
        </p>
      </div>
    </div>
  );
}
