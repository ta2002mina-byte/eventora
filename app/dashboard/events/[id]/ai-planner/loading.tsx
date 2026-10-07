import { Skeleton } from "@/components/ui/Skeleton";

export default function EventAiPlannerLoading() {
  return (
    <main className="container-page py-10 sm:py-14">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="mt-3 h-6 w-40" />
      <Skeleton className="mt-3 h-9 w-96" />
      <div className="mt-8 max-w-3xl space-y-4">
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-11 w-full" />
      </div>
    </main>
  );
}
