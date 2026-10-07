import { Skeleton } from "@/components/ui/Skeleton";

export default function EventOverviewLoading() {
  return (
    <main className="container-page py-10 sm:py-14">
      <Skeleton className="h-6 w-24" />
      <Skeleton className="mt-3 h-9 w-2/3" />
      <Skeleton className="mt-3 h-5 w-1/3" />
      <Skeleton className="mt-8 h-20 w-full rounded-card" />
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Skeleton className="h-28 w-full rounded-card" />
        <Skeleton className="h-28 w-full rounded-card" />
        <Skeleton className="h-28 w-full rounded-card" />
        <Skeleton className="h-28 w-full rounded-card" />
      </div>
    </main>
  );
}
