import { Skeleton } from "@/components/ui/Skeleton";

export default function VenueDetailLoading() {
  return (
    <main className="container-page py-10">
      <Skeleton className="h-5 w-32" />
      <Skeleton className="mt-6 h-56 w-full rounded-card sm:h-72" />
      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-9 w-3/4" />
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="mt-6 h-24 w-full" />
        </div>
        <Skeleton className="h-72 w-full rounded-card" />
      </div>
    </main>
  );
}
