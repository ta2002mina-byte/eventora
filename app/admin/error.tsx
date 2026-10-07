"use client";

import { Button } from "@/components/ui/Button";

export default function AdminError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-lg rounded-card border border-border bg-white p-8 text-center shadow-softer">
      <h2 className="text-xl font-medium">Something went wrong</h2>
      <p className="mt-2 text-sm text-charcoal-400">{error.message || "An unexpected error occurred."}</p>
      <Button className="mt-5" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
