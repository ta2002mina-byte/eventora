import { Skeleton } from "@/components/ui/Skeleton";

export default function AiPlannerLoading() {
  return (
    <main className="container-page py-10 sm:py-14">
      <div className="mx-auto max-w-2xl text-center">
        <Skeleton className="mx-auto h-6 w-40" />
        <Skeleton className="mx-auto mt-4 h-9 w-72" />
        <Skeleton className="mx-auto mt-3 h-5 w-full max-w-lg" />
      </div>
      <div className="mx-auto mt-10 max-w-3xl space-y-4">
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-11 w-full" />
      </div>
    </main>
  );
}
