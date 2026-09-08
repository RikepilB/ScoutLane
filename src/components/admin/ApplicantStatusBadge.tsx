import { Badge, type BadgeProps } from "@/components/ui/badge";

const statusTones: Record<string, NonNullable<BadgeProps["tone"]>> = {
  NEW: "info",
  REVIEWING: "warning",
  SHORTLISTED: "brand",
  INTERVIEW: "brand",
  OFFERED: "success",
  REJECTED: "danger",
  WITHDRAWN: "neutral",
};

export function ApplicantStatusBadge({ status }: { status: string }) {
  return <Badge tone={statusTones[status] ?? "neutral"}>{status}</Badge>;
}
