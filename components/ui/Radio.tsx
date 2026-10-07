import * as React from "react";
import { cn } from "@/lib/utils";

export interface RadioProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
}

export const Radio = React.forwardRef<HTMLInputElement, RadioProps>(
  ({ className, label, id, ...props }, ref) => {
    const generatedId = React.useId();
    const radioId = id ?? generatedId;

    return (
      <label
        htmlFor={radioId}
        className="inline-flex cursor-pointer items-center gap-2.5 text-sm text-charcoal"
      >
        <input
          ref={ref}
          id={radioId}
          type="radio"
          className={cn(
            "h-5 w-5 shrink-0 appearance-none rounded-full border border-border bg-white",
            "checked:border-[5px] checked:border-purple-700",
            "focus-visible:outline focus-visible:outline-2 focus-visible:outline-purple-500",
            className
          )}
          {...props}
        />
        {label}
      </label>
    );
  }
);
Radio.displayName = "Radio";
