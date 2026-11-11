import * as React from "react";
import { cn } from "@/lib/utils";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, children, ...props }, ref) => (
    <div className="w-full">
      <select
        ref={ref}
        className={cn(
          "flex h-11 w-full rounded-md border border-input bg-white px-3 text-sm text-ink transition-colors duration-150",
          "focus-visible:outline-none focus-visible:border-ink focus-visible:ring-2 focus-visible:ring-ink/10",
          "disabled:cursor-not-allowed disabled:bg-surface disabled:opacity-60",
          error && "border-live",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      {error && <p className="mt-1.5 text-xs text-live">{error}</p>}
    </div>
  ),
);
Select.displayName = "Select";

export { Select };
