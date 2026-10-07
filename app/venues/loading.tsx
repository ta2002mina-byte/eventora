import { Skeleton } from "@/components/ui/Skeleton";

export default function VenuesLoading() {
  return (
    <main className="container-page py-10">
      <Skeleton className="h-9 w-40" />
      <Skeleton className="mt-3 h-5 w-64" />

      <div className="mt-8 h-16 rounded-card border border-border bg-white" />

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-card border border-border">
            <Skeleton className="h-40 w-full rounded-none" />
            <div className="space-y-3 p-5">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
