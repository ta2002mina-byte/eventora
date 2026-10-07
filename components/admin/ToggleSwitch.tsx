"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

/** Inline on/off switch that calls a pre-bound Server Action with the new value. */
export function ToggleSwitch({
  checked,
  action,
  label,
}: {
  checked: boolean;
  action: (value: boolean) => Promise<void>;
  label: string;
}) {
  const router = useRouter();
  const [value, setValue] = React.useState(checked);
  const [pending, startTransition] = React.useTransition();

  React.useEffect(() => setValue(checked), [checked]);

  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      aria-label={label}
      disabled={pending}
      onClick={() => {
        const next = !value;
        setValue(next);
        startTransition(async () => {
          try {
            await action(next);
            router.refresh();
          } catch {
            setValue(!next);
          }
        });
      }}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-60",
        value ? "bg-purple-700" : "bg-charcoal/20"
      )}
    >
      <span
        className={cn(
          "inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform",
          value ? "translate-x-5" : "translate-x-0.5"
        )}
      />
    </button>
  );
}
