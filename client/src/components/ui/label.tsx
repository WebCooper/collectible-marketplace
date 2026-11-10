import * as React from "react";
import { cn } from "@/lib/utils";

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, children, required, ...props }, ref) => (
    <label
      ref={ref}
      className={cn(
        "text-[13px] font-medium text-ink block mb-1.5",
        className
      )}
      {...props}
    >
      {children}
      {required && <span className="text-live ml-0.5">*</span>}
    </label>
  )
);
Label.displayName = "Label";

export { Label };
