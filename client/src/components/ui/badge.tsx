import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "gold" | "cyan" | "pcgs" | "ngc" | "pmg" | "slns" | "live" | "outline" | "secondary";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variants = {
    default: "bg-[#101726] text-zinc-200 border-[rgba(201,162,39,0.2)]",
    secondary: "bg-[#101726]/80 text-zinc-300 border-zinc-700/40",
    gold: "bg-gradient-to-r from-[#c9a227]/20 to-[#f1d27a]/15 text-[#f1d27a] border-[#c9a227]/40 shadow-sm shadow-[#c9a227]/10",
    cyan: "bg-cyan-950/80 text-cyan-300 border-cyan-400/40 shadow-sm shadow-cyan-500/15",
    pcgs: "bg-blue-950/80 text-blue-300 border-blue-500/40",
    ngc: "bg-emerald-950/80 text-emerald-300 border-emerald-500/40",
    pmg: "bg-purple-950/80 text-purple-300 border-purple-500/40",
    slns: "bg-amber-950/80 text-amber-300 border-amber-500/40",
    live: "bg-cyan-950/90 text-cyan-300 border-cyan-400/50 shadow-sm shadow-cyan-400/20",
    outline: "text-zinc-300 border-[rgba(201,162,39,0.25)]",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide transition-colors uppercase font-mono",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

export { Badge };
