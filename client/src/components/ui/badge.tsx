import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "gold" | "cyan" | "pcgs" | "ngc" | "pmg" | "slns" | "live" | "outline" | "secondary";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variants = {
    default: "bg-white text-ink border-line",
    secondary: "bg-surface text-ink-soft border-line",
    gold: "bg-brass-soft text-brass border-brass/25",
    cyan: "bg-live-soft text-live border-live/25",
    pcgs: "bg-blue-50 text-blue-800 border-blue-200",
    ngc: "bg-emerald-50 text-emerald-800 border-emerald-200",
    pmg: "bg-purple-50 text-purple-800 border-purple-200",
    slns: "bg-amber-50 text-amber-800 border-amber-200",
    live: "bg-live text-white border-live",
    outline: "bg-transparent text-ink-soft border-line-strong",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-sm border px-2 py-0.5 text-[10px] font-semibold tracking-[0.08em] transition-colors uppercase",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

export { Badge };
