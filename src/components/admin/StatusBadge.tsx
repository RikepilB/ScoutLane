import { cn } from "@/lib/utils/cn";

const statusStyles: Record<string, string> = {
  active: "bg-[rgba(45,138,106,0.12)] text-[#2d8a6a]",
  draft: "bg-[rgba(200,140,40,0.12)] text-[#c88c28]",
  closed: "bg-[rgba(95,142,160,0.16)] text-[#5f8ea0]",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11.5px] font-medium capitalize",
        statusStyles[status] || "bg-[rgba(95,142,160,0.16)] text-[#5f8ea0]",
      )}
      style={{ fontFamily: "var(--font-body)" }}
    >
      {status}
    </span>
  );
}
