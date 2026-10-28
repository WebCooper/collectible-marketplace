import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "gold" | "cyan" | "outline" | "ghost" | "secondary" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", isLoading, children, disabled, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a227]/50 disabled:pointer-events-none disabled:opacity-50 cursor-pointer active:scale-[0.98]";

    const variants = {
      default:
        "bg-white text-zinc-950 shadow-md hover:bg-zinc-100 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white",
      gold:
        "bg-gradient-to-r from-[#c9a227] via-[#e2be49] to-[#f1d27a] text-[#0a0e17] font-bold shadow-md shadow-[#c9a227]/25 hover:shadow-lg hover:shadow-[#c9a227]/35 hover:brightness-105 border border-[#f1d27a]/40",
      cyan:
        "bg-gradient-to-r from-cyan-500 to-teal-400 text-stone-950 font-bold shadow-md shadow-cyan-500/25 hover:shadow-lg hover:shadow-cyan-500/35 hover:brightness-105 border border-cyan-300/40",
      outline:
        "border border-[rgba(201,162,39,0.3)] bg-[#0d1424]/40 backdrop-blur-md text-zinc-200 hover:bg-[#0d1424]/80 hover:text-white hover:border-[#c9a227]/60",
      ghost:
        "text-zinc-300 hover:bg-white/10 hover:text-white",
      secondary:
        "bg-[#131c2d] text-zinc-100 border border-[rgba(201,162,39,0.2)] hover:bg-[#1a263d] hover:border-[rgba(201,162,39,0.4)]",
      destructive:
        "bg-red-600/90 text-white hover:bg-red-600 shadow-sm",
    };

    const sizes = {
      default: "h-10 px-4 py-2",
      sm: "h-8 rounded-lg px-3 text-xs",
      lg: "h-12 rounded-xl px-7 text-base font-semibold",
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
