import { Skeleton } from "@/components/ui/Skeleton";

export default function VendorDashboardLoading() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <Skeleton className="h-5 w-24" />
      <Skeleton className="mt-2 h-8 w-64" />
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-card" />
        ))}
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <Skeleton className="h-64 w-full rounded-card lg:col-span-2" />
        <Skeleton className="h-64 w-full rounded-card" />
      </div>
    </main>
  );
}
