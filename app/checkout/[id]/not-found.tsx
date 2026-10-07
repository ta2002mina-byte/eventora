import Link from "next/link";
import { ClipboardX } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";

export default function CheckoutNotFound() {
  return (
    <main className="container-page py-16">
      <EmptyState
        icon={<ClipboardX className="h-6 w-6" />}
        title="Order not found"
        description="This order may have expired or you don't have access to it."
      />
      <div className="mt-6 text-center">
        <Link href="/events" className="text-sm font-medium text-purple-700 hover:underline">
          Browse events
        </Link>
      </div>
    </main>
  );
}
