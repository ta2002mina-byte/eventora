import { Skeleton } from "@/components/ui/Skeleton";

export default function CheckoutLoading() {
  return (
    <main className="container-page py-10 sm:py-14">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="mt-3 h-9 w-40" />
      <div className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_1fr]">
        <Skeleton className="h-80 w-full rounded-card" />
        <Skeleton className="h-48 w-full rounded-card" />
      </div>
    </main>
  );
}
