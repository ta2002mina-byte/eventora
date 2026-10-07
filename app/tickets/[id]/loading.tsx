import { Skeleton } from "@/components/ui/Skeleton";

export default function TicketDetailLoading() {
  return (
    <main className="container-page py-10 sm:py-14">
      <Skeleton className="h-4 w-24" />
      <div className="mx-auto mt-6 max-w-md">
        <Skeleton className="h-40 w-full rounded-t-card" />
        <Skeleton className="h-64 w-full rounded-b-card" />
      </div>
    </main>
  );
}
