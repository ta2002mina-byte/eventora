import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  error?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const generatedId = React.useId();
    const checkboxId = id ?? generatedId;

    return (
      <div>
        <label
          htmlFor={checkboxId}
          className="inline-flex cursor-pointer items-center gap-2.5 text-sm text-charcoal"
        >
          <span className="relative inline-flex h-5 w-5 shrink-0 items-center justify-center">
            <input
              ref={ref}
              id={checkboxId}
              type="checkbox"
              className={cn(
                "peer h-5 w-5 shrink-0 appearance-none rounded-md border border-border bg-white",
                "checked:border-purple-700 checked:bg-purple-700",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-purple-500",
                className
              )}
              {...props}
            />
            <Check
              className="pointer-events-none absolute h-3.5 w-3.5 text-white opacity-0 peer-checked:opacity-100"
              aria-hidden="true"
            />
          </span>
          {label}
        </label>
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </div>
    );
  }
);
Checkbox.displayName = "Checkbox";
