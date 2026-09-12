import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "gold" | "pcgs" | "ngc" | "pmg" | "cgc" | "live" | "outline" | "secondary";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variants = {
    default: "bg-zinc-800 text-zinc-200 border-zinc-700/60",
    secondary: "bg-zinc-800/80 text-zinc-300 border-zinc-700/40",
    gold: "bg-gradient-to-r from-amber-500/20 to-yellow-500/10 text-amber-300 border-amber-500/40 shadow-sm shadow-amber-500/10",
    pcgs: "bg-blue-950/80 text-blue-300 border-blue-500/40",
    ngc: "bg-emerald-950/80 text-emerald-300 border-emerald-500/40",
    pmg: "bg-purple-950/80 text-purple-300 border-purple-500/40",
    cgc: "bg-amber-950/80 text-amber-300 border-amber-600/40",
    live: "bg-red-950/80 text-red-400 border-red-500/40 animate-pulse",
    outline: "text-zinc-300 border-zinc-700",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide transition-colors uppercase",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

export { Badge };
