import { Skeleton } from "@/components/ui/Skeleton";

export default function EventPlannerLoading() {
  return (
    <main className="container-page py-10 sm:py-14">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="mt-3 h-9 w-40" />
      <Skeleton className="mt-6 h-16 w-full rounded-card" />
      <div className="mt-8 grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Skeleton className="h-72 w-full rounded-card" />
        <div className="space-y-6">
          <Skeleton className="h-32 w-full rounded-card" />
          <Skeleton className="h-32 w-full rounded-card" />
        </div>
      </div>
    </main>
  );
}
