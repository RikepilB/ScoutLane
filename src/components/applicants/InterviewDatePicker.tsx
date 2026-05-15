"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Loader2, X } from "lucide-react";
import { updateInterviewDate } from "@/server/services/applicants/update";

interface InterviewDatePickerProps {
  applicantId: string;
  interviewDate: string | null;
}

export function InterviewDatePicker({ applicantId, interviewDate }: InterviewDatePickerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [date, setDate] = useState(interviewDate ?? "");

  function handleSave() {
    startTransition(async () => {
      await updateInterviewDate(applicantId, date || null);
      router.refresh();
    });
  }

  function handleClear() {
    setDate("");
    startTransition(async () => {
      await updateInterviewDate(applicantId, null);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Calendar className="h-4 w-4 text-muted-foreground" />
      <input
        type="datetime-local"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="rounded-lg border border-border/70 px-3 py-1.5 text-xs outline-none focus:border-sky-500"
      />
      {date && (
        <button
          onClick={handleClear}
          disabled={isPending}
          className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
        >
          <X className="h-3 w-3" />
          Clear
        </button>
      )}
      <button
        onClick={handleSave}
        disabled={isPending || !date}
        className="inline-flex items-center gap-1 rounded-lg bg-slate-950 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-slate-800 disabled:opacity-50"
      >
        {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
        Set interview
      </button>
    </div>
  );
}
