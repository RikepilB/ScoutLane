import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

/**
 * One badge, one set of tones. Before this existed, `StatusBadge` used rgba
 * literals and `ApplicantStatusBadge` used raw Tailwind palette classes, so
 * the same "this is a state" idea rendered in two unrelated colour systems.
 */
const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
  {
    variants: {
      tone: {
        neutral: "bg-paper-2 text-ink-700",
        brand: "bg-peri/15 text-brand-slate",
        success: "bg-success-soft text-success",
        warning: "bg-warning-soft text-warning",
        danger: "bg-danger-soft text-danger",
        info: "bg-info-soft text-info",
      },
      outline: {
        true: "bg-transparent ring-1 ring-inset ring-current",
        false: "",
      },
    },
    defaultVariants: { tone: "neutral", outline: false },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, tone, outline, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone, outline, className }))} {...props} />;
}

export { Badge, badgeVariants };
