import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "gold" | "outline" | "ghost" | "secondary" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", isLoading, children, disabled, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50 disabled:pointer-events-none disabled:opacity-50 cursor-pointer active:scale-[0.98]";

    const variants = {
      default:
        "bg-white text-zinc-900 shadow-md hover:bg-zinc-100 hover:shadow-lg dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white",
      gold:
        "bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-stone-950 font-semibold shadow-md shadow-amber-500/20 hover:shadow-lg hover:shadow-amber-500/30 hover:brightness-105 border border-amber-300/40",
      outline:
        "border border-white/15 bg-white/5 backdrop-blur-sm text-zinc-200 hover:bg-white/10 hover:text-white hover:border-amber-500/40",
      ghost:
        "text-zinc-300 hover:bg-white/10 hover:text-white",
      secondary:
        "bg-zinc-800/80 text-zinc-100 border border-zinc-700/60 hover:bg-zinc-700/80 hover:border-zinc-600",
      destructive:
        "bg-red-600/90 text-white hover:bg-red-600 shadow-sm",
    };

    const sizes = {
      default: "h-10 px-4 py-2",
      sm: "h-8 rounded-md px-3 text-xs",
      lg: "h-12 rounded-xl px-6 text-base font-semibold",
      icon: "h-10 w-10",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && (
          <svg
            className="mr-2 h-4 w-4 animate-spin text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button };
