import { Skeleton } from "@/components/ui/Skeleton";

/**
 * A generic loading skeleton reused across the vendor dashboard's
 * simpler subroutes (customers, earnings, reviews, calendar, settings)
 * so each route's loading.tsx stays a one-liner instead of duplicating
 * markup.
 */
export function VendorDashboardSectionSkeleton({
  cards = 3,
  rows = 4,
}: {
  cards?: number;
  rows?: number;
}) {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="mt-2 h-4 w-72" />

      {cards > 0 && (
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {Array.from({ length: cards }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-card" />
          ))}
        </div>
      )}

      <div className="mt-6 space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-card" />
        ))}
      </div>
    </main>
  );
}
