import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "purple" | "gold" | "gray" | "success" | "warning" | "danger";

const variantStyles: Record<Variant, string> = {
  purple: "bg-purple-50 text-purple-700",
  gold: "bg-gold-50 text-gold-600",
  gray: "bg-charcoal/5 text-charcoal-600",
  success: "bg-emerald-50 text-emerald-700",
  warning: "bg-amber-50 text-amber-700",
  danger: "bg-red-50 text-red-700",
};

export function Badge({
  className,
  variant = "purple",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: Variant }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-pill px-2.5 py-1 text-xs font-medium",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
}
