const statusColors: Record<string, string> = {
  NEW: "bg-indigo-50 text-indigo-700",
  REVIEWING: "bg-amber-50 text-amber-700",
  SHORTLISTED: "bg-sky-50 text-sky-700",
  INTERVIEW: "bg-blue-50 text-blue-700",
  OFFERED: "bg-emerald-50 text-emerald-700",
  REJECTED: "bg-red-50 text-red-700",
  WITHDRAWN: "bg-slate-100 text-slate-600",
};

export function ApplicantStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        statusColors[status] || "bg-slate-100 text-slate-700"
      }`}
    >
      {status}
    </span>
  );
}
