import { Skeleton } from "@/components/ui/Skeleton";

export default function EventGuestsLoading() {
  return (
    <main className="container-page py-10 sm:py-14">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="mt-3 h-9 w-40" />
      <Skeleton className="mt-6 h-10 w-full rounded-card" />
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Skeleton className="h-24 w-full rounded-card" />
        <Skeleton className="h-24 w-full rounded-card" />
        <Skeleton className="h-24 w-full rounded-card" />
        <Skeleton className="h-24 w-full rounded-card" />
      </div>
      <Skeleton className="mt-6 h-96 w-full rounded-card" />
    </main>
  );
}
