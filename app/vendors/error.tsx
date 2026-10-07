"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/ui/ErrorState";

export default function VendorsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="container-page py-10">
      <ErrorState
        title="Couldn't load vendors"
        description="Something went wrong while fetching vendors. Please try again."
        onRetry={reset}
      />
    </main>
  );
}
