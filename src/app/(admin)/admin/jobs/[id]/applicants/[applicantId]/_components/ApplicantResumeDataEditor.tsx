"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { saveApplicantResumeDataJson } from "@/server/services/applicants/update";

interface ApplicantResumeDataEditorProps {
  applicantId: string;
  initialData: unknown;
}

export function ApplicantResumeDataEditor({ applicantId, initialData }: ApplicantResumeDataEditorProps) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [text, setText] = useState(() => JSON.stringify(initialData ?? {}, null, 2));

  useEffect(() => {
    setText(JSON.stringify(initialData ?? {}, null, 2));
  }, [initialData]);

  function handleSave() {
    try {
      JSON.parse(text);
    } catch {
      toast.error("Invalid JSON. Fix the syntax and try again.");
      return;
    }
    start(async () => {
      try {
        await saveApplicantResumeDataJson(applicantId, text);
        toast.success("Applicant data saved.");
        router.refresh();
      } catch {
        toast.error("Could not save the applicant data. Try again.");
      }
    });
  }

  return (
    <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Structured applicant data</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Merge-edit the JSON stored on the applicant (education, work, skills, customFields). Invalid JSON will be rejected.
          </p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={pending}
          className="inline-flex items-center gap-1.5 rounded-lg bg-slate-950 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
          Save merge
        </button>
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        spellCheck={false}
        rows={14}
        className="mt-3 w-full rounded-xl border border-border/60 bg-slate-950/90 p-3 font-mono text-xs leading-relaxed text-slate-50 outline-none focus:border-sky-500"
      />
    </div>
  );
}
