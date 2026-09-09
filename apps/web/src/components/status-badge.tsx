import type { ReactNode } from "react";
import { cn } from "@agent-platform/ui/lib/utils";

type BadgeTone = "success" | "warning" | "danger" | "neutral";

type StatusBadgeProps = {
  children: ReactNode;
  tone?: BadgeTone;
};

const toneClasses: Record<BadgeTone, string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  danger: "border-rose-200 bg-rose-50 text-rose-800",
  neutral: "border-border bg-muted/50 text-muted-foreground",
};

export function StatusBadge({ children, tone = "neutral" }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center border px-2 py-0.5 text-xs font-semibold tracking-wide",
        toneClasses[tone],
      )}
    >
      {children}
    </span>
  );
}
