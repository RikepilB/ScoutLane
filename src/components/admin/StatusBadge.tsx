import { Badge, type BadgeProps } from "@/components/ui/badge";

const statusTones: Record<string, NonNullable<BadgeProps["tone"]>> = {
  active: "success",
  draft: "warning",
  closed: "neutral",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge tone={statusTones[status] ?? "neutral"} className="capitalize">
      {status}
    </Badge>
  );
}
