// Allowed applicant status filter values — mirrors the `ApplicationStatus`
// enum. Used to render the status chips AND to guard the value before it
// reaches Prisma, since an unknown status would raise a query validation error.
export const APPLICATION_STATUSES = [
  "NEW",
  "REVIEWING",
  "SHORTLISTED",
  "INTERVIEW",
  "OFFERED",
  "REJECTED",
  "WITHDRAWN",
] as const;

export type ApplicationStatusFilter = (typeof APPLICATION_STATUSES)[number];

export function isApplicationStatus(value: string): value is ApplicationStatusFilter {
  return (APPLICATION_STATUSES as readonly string[]).includes(value);
}

export function extractFromData(data: unknown, field: string): string[] {
  if (!data || typeof data !== "object") return [];
  const d = data as Record<string, unknown>;
  if (field === "institution") {
    const edu = d.education as Array<{ institution?: string }> | undefined;
    return (edu?.map((e) => e.institution).filter(Boolean) as string[]) ?? [];
  }
  if (field === "degree") {
    const edu = d.education as Array<{ field?: string; degree?: string }> | undefined;
    return (edu?.map((e) => e.field ?? e.degree).filter(Boolean) as string[]) ?? [];
  }
  if (field === "skills") {
    return (d.skills as string[]) ?? [];
  }
  return [];
}

export function getFirstInstitution(data: unknown): string | null {
  return extractFromData(data, "institution")[0] ?? null;
}

export function getFirstDegree(data: unknown): string | null {
  return extractFromData(data, "degree")[0] ?? null;
}

export function getSkills(data: unknown): string[] {
  return extractFromData(data, "skills");
}

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function buildApplicantsHref(
  jobId: string,
  filters: Record<string, string>,
  updates: Record<string, string | undefined>,
): string {
  const params = new URLSearchParams();
  const current = { ...filters, ...updates };
  Object.entries(current).forEach(([k, v]) => {
    if (v && v !== "all") params.set(k, v);
  });
  const qs = params.toString();
  return `/admin/jobs/${jobId}/applicants${qs ? `?${qs}` : ""}`;
}
