"use client";

import { useRouter } from "next/navigation";
import { updateApplicantStatus } from "@/server/services/applicants";

const statuses = ["NEW", "REVIEWING", "SHORTLISTED", "INTERVIEW", "OFFERED", "REJECTED", "WITHDRAWN"] as const;

export function ApplicantActions({ applicantId, currentStatus, jobId }: { applicantId: string; currentStatus: string; jobId: string }) {
  const router = useRouter();

  async function handleStatusChange(e: React.ChangeEvent<HTMLSelectElement>) {
    await updateApplicantStatus(applicantId, e.target.value);
    router.refresh();
  }

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-muted-foreground">Change status</label>
      <select
        defaultValue={currentStatus}
        onChange={handleStatusChange}
        className="rounded-xl border border-border/70 bg-white px-4 py-2.5 text-sm outline-none focus:border-sky-500"
      >
        {statuses.map((s) => (
          <option key={s} value={s}>
            {s.charAt(0) + s.slice(1).toLowerCase()}
          </option>
        ))}
      </select>
    </div>
  );
}
