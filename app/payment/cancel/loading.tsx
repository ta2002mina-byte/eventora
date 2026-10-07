import { Skeleton } from "@/components/ui/Skeleton";

export default function PaymentCancelLoading() {
  return (
    <main className="container-page py-14 text-center">
      <Skeleton className="mx-auto h-16 w-16 rounded-full" />
      <Skeleton className="mx-auto mt-5 h-9 w-64" />
      <Skeleton className="mx-auto mt-2 h-5 w-80" />
    </main>
  );
}
