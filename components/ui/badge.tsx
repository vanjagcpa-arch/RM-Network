import * as React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "outline";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        variant === "default" && "border-transparent bg-[#9CFF5F] text-[#0F172A]",
        variant === "secondary" && "border-transparent bg-slate-100 text-slate-900",
        variant === "outline" && "border-current text-current",
        className
      )}
      {...props}
    />
  );
}
