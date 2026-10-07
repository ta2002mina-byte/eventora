"use client";

import * as React from "react";
import { Button, type ButtonProps } from "@/components/ui/Button";

/**
 * A submit button that asks for confirmation first. `action` is a Server
 * Action (usually pre-bound with its ids in a Server Component).
 */
export function ConfirmButton({
  action,
  message,
  children,
  variant = "danger",
  size = "sm",
  className,
}: {
  action: (formData: FormData) => void | Promise<void>;
  message: string;
  children: React.ReactNode;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  className?: string;
}) {
  const [pending, startTransition] = React.useTransition();

  return (
    <form
      action={(fd) => {
        if (!window.confirm(message)) return;
        startTransition(() => {
          void action(fd);
        });
      }}
      className="inline"
    >
      <Button type="submit" variant={variant} size={size} isLoading={pending} className={className}>
        {children}
      </Button>
    </form>
  );
}
