import type { Control } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { EditJobFormValues } from "./job-edit-schema";

interface EditJobDescriptionFieldProps {
  control: Control<EditJobFormValues>;
  descMode: "write" | "link";
  setDescMode: (mode: "write" | "link") => void;
}

export function EditJobDescriptionField({
  control,
  descMode,
  setDescMode,
}: EditJobDescriptionFieldProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium">Description source</span>
        <label className="flex items-center gap-1.5 text-sm">
          <input
            type="radio"
            name="descMode"
            value="write"
            checked={descMode === "write"}
            onChange={() => setDescMode("write")}
          />
          Write description
        </label>
        <label className="flex items-center gap-1.5 text-sm">
          <input
            type="radio"
            name="descMode"
            value="link"
            checked={descMode === "link"}
            onChange={() => setDescMode("link")}
          />
          Link to hosted PDF/Google Doc
        </label>
      </div>

      {descMode === "link" ? (
        <FormField
          control={control}
          name="descriptionUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description URL</FormLabel>
              <FormControl>
                <Input
                  type="url"
                  placeholder="https://docs.google.com/document/d/..."
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      ) : (
        <FormField
          control={control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe the role, expectations, and requirements."
                  className="min-h-48"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </div>
  );
}
