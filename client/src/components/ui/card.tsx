import * as React from "react";
import { cn } from "@/lib/utils";

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { hoverEffect?: boolean; glow?: "gold" | "cyan" | "none" }
>(({ className, hoverEffect = false, glow = "none", ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-2xl border border-[rgba(201,162,39,0.2)] bg-[rgba(14,20,32,0.65)] backdrop-blur-xl text-zinc-100 shadow-2xl transition-all duration-300",
      glow === "gold" && "border-[rgba(201,162,39,0.35)] shadow-[0_0_25px_rgba(201,162,39,0.1)]",
      glow === "cyan" && "border-[rgba(34,211,238,0.35)] shadow-[0_0_25px_rgba(34,211,238,0.12)]",
      hoverEffect &&
        "hover:border-[rgba(201,162,39,0.45)] hover:bg-[rgba(14,20,32,0.85)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.8),0_0_30px_rgba(201,162,39,0.12)] hover:-translate-y-1",
      className
    )}
    {...props}
  />
));
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-xl font-bold leading-tight tracking-tight text-white font-serif",
      className
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-zinc-400 leading-relaxed", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
