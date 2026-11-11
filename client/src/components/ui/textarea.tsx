import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => (
    <div className="w-full">
      <textarea
        ref={ref}
        className={cn(
          "flex min-h-[110px] w-full rounded-md border border-input bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-[#9a968d] transition-colors duration-150",
          "focus-visible:outline-none focus-visible:border-ink focus-visible:ring-2 focus-visible:ring-ink/10",
          "disabled:cursor-not-allowed disabled:bg-surface disabled:opacity-60",
          error && "border-live focus-visible:ring-live/15 focus-visible:border-live",
          className,
        )}
        {...props}
      />
      {error && <p className="mt-1.5 text-xs text-live">{error}</p>}
    </div>
  ),
);
Textarea.displayName = "Textarea";

export { Textarea };
