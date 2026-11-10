import * as React from "react";
import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type AlertVariant = "error" | "success" | "info";

const styles: Record<AlertVariant, string> = {
  error: "border-live/30 bg-live-soft text-live",
  success: "border-success/30 bg-success-soft text-success",
  info: "border-line bg-surface text-ink-soft",
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
        "flex items-start gap-2.5 rounded-md border px-3.5 py-3 text-[13px] leading-relaxed",
        styles[variant],
        className,
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0 flex-1 space-y-1">{children}</div>
    </div>
  );
}
