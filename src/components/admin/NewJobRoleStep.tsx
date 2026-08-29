import type { Control } from "react-hook-form";
import type { z } from "zod";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { jobCreationSchema } from "@/schemas/job";

type FormValues = z.input<typeof jobCreationSchema>;

interface NewJobRoleStepProps {
  control: Control<FormValues>;
}

export function NewJobRoleStep({ control }: NewJobRoleStepProps) {
  return (
    <div className="space-y-5">
      <FormField
        control={control}
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
        control={control}
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
            control={control}
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
            control={control}
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
            control={control}
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
  );
}
