import { Skeleton } from "@/components/ui/Skeleton";

export default function BookingLoading() {
  return (
    <main className="container-page py-10 sm:py-14">
      <Skeleton className="h-4 w-32" />
      <div className="mx-auto mt-6 max-w-2xl">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="mt-3 h-9 w-2/3" />
        <Skeleton className="mt-3 h-5 w-1/2" />
        <Skeleton className="mt-8 h-80 w-full rounded-card" />
      </div>
    </main>
  );
}
