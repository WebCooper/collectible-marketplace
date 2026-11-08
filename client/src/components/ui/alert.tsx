import * as React from "react";
import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type AlertVariant = "error" | "success" | "info";

const styles: Record<AlertVariant, string> = {
  error: "border-red-500/40 bg-red-950/40 text-red-200",
  success: "border-cyan-400/40 bg-cyan-950/50 text-cyan-200",
  info: "border-[rgba(201,162,39,0.35)] bg-[#141c2c]/80 text-zinc-300",
};

const icons: Record<AlertVariant, React.ElementType> = {
  error: AlertTriangle,
  success: CheckCircle2,
  info: Info,
};

export function Alert({
  variant = "info",
  className,
  children,
}: {
  variant?: AlertVariant;
  className?: string;
  children: React.ReactNode;
}) {
  const Icon = icons[variant];
  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-xs leading-relaxed",
        styles[variant],
        className,
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0 flex-1 space-y-1">{children}</div>
    </div>
  );
}
