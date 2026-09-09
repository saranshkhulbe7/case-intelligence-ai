import type { ComponentProps } from "react";
import { cn } from "#lib/utils";

export function Input({ className, type, ...props }: ComponentProps<"input">) {
  return (
    <input
      type={type}
      className={cn(
        "flex h-8 w-full rounded-md border border-input bg-surface px-3 text-[13px] leading-5 transition-colors placeholder:text-muted-foreground hover:border-border-strong focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25 disabled:cursor-not-allowed disabled:bg-surface-muted disabled:opacity-60",
        className,
      )}
      {...props}
    />
  );
}
