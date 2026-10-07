"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/ui/ErrorState";

/**
 * A generic error boundary reused across the vendor dashboard's
 * simpler subroutes so each route's error.tsx stays a one-liner.
 */
export function VendorDashboardSectionError({
  error,
  reset,
  title = "Couldn't load this page",
}: {
  error: Error & { digest?: string };
  reset: () => void;
  title?: string;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
      <ErrorState title={title} description="Something went wrong. Please try again." onRetry={reset} />
    </main>
  );
}
