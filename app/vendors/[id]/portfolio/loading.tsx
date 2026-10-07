import { Skeleton } from "@/components/ui/Skeleton";

export default function VendorPortfolioLoading() {
  return (
    <main className="container-page py-10">
      <Skeleton className="h-5 w-40" />
      <Skeleton className="mt-6 h-6 w-24" />
      <Skeleton className="mt-3 h-9 w-2/3" />
      <Skeleton className="mt-2 h-5 w-48" />

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square w-full rounded-card" />
        ))}
      </div>
    </main>
  );
}
