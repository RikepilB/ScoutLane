"use client";

import { useRef, useState } from "react";
import { Eye, FileUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { renderMarkdown } from "@/lib/utils/markdown";
import type { TemplateData } from "./template-data";

interface TemplateJobDefaultsSectionProps {
  template: TemplateData;
}

export function TemplateJobDefaultsSection({ template }: TemplateJobDefaultsSectionProps) {
  const [preview, setPreview] = useState(false);
  const [fileStatus, setFileStatus] = useState<string | null>(null);
  const descRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [descMode, setDescMode] = useState<"write" | "link">(
    template.descriptionUrl ? "link" : "write",
  );

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      if (descRef.current) {
        descRef.current.value = content;
      }
      setFileStatus(`Loaded ${file.name}`);
      setTimeout(() => setFileStatus(null), 3000);
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  const previewContent = descRef.current?.value ?? template.jobDescription ?? "";

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-base font-semibold tracking-tight">
          Job defaults
        </h2>
        <p className="text-sm text-muted-foreground">
          These values prefill new jobs and are copied at creation time.
        </p>
      </div>
      <label className="space-y-2 text-sm font-medium">
        Default job title
        <Input name="title" defaultValue={template.title} required />
      </label>

      <div className="space-y-3 text-sm font-medium">
        <div className="flex items-center justify-between">
          <span>Default description</span>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 text-xs font-normal">
              <input
                type="radio"
                name="descMode"
                value="write"
                checked={descMode === "write"}
                onChange={() => setDescMode("write")}
              />
              Write description
            </label>
            <label className="flex items-center gap-1.5 text-xs font-normal">
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
        </div>

        {descMode === "link" ? (
          <>
            <Input
              type="url"
              name="descriptionUrl"
              placeholder="https://docs.google.com/document/d/..."
              defaultValue={template.descriptionUrl ?? ""}
            />
            <input type="hidden" name="jobDescription" value="" />
          </>
        ) : (
          <>
            <div className="flex items-center justify-end gap-2">
              {fileStatus ? (
                <span className="text-xs text-muted-foreground">
                  {fileStatus}
                </span>
              ) : null}
              <input
                ref={fileRef}
                type="file"
                accept=".md"
                className="hidden"
                onChange={handleFile}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileRef.current?.click()}
              >
                <FileUp className="h-3.5 w-3.5" />
                Upload .md
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPreview(!preview)}
              >
                {preview ? (
                  <>
                    <Eye className="h-3.5 w-3.5" />
                    Edit
                  </>
                ) : (
                  <>
                    <Eye className="h-3.5 w-3.5" />
                    Preview
                  </>
                )}
              </Button>
            </div>
            {preview ? (
              <div className="min-h-48 rounded-md border border-input bg-background px-3 py-2 text-sm">
                {previewContent ? (
                  <div
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{
                      __html: renderMarkdown(previewContent),
                    }}
                  />
                ) : (
                  <span className="text-muted-foreground">
                    Nothing to preview
                  </span>
                )}
              </div>
            ) : (
              <Textarea
                ref={descRef}
                name="jobDescription"
                className="min-h-48"
                defaultValue={template.jobDescription ?? ""}
              />
            )}
            <input type="hidden" name="descriptionUrl" value="" />
          </>
        )}
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <label className="space-y-2 text-sm font-medium">
          Location
          <Input name="location" defaultValue={template.location ?? ""} />
        </label>
        <label className="space-y-2 text-sm font-medium">
          Type
          <Input name="type" defaultValue={template.type ?? ""} />
        </label>
        <label className="space-y-2 text-sm font-medium">
          Salary
          <Input name="salary" defaultValue={template.salary ?? ""} />
        </label>
      </div>
    </section>
  );
}
