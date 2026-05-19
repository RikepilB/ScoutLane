import { cn } from "@/lib/utils/cn";

const statusStyles: Record<string, string> = {
  active: "bg-[rgba(5,150,105,0.12)] text-[#059669]",
  draft: "bg-[rgba(217,119,6,0.12)] text-[#D97706]",
  closed: "bg-[rgba(107,114,128,0.16)] text-[#6B7280]",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11.5px] font-medium capitalize",
        statusStyles[status] || "bg-[rgba(107,114,128,0.16)] text-[#6B7280]",
      )}
      style={{ fontFamily: "var(--font-body)" }}
    >
      {status}
    </span>
  );
}
