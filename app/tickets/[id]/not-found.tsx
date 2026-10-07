import Link from "next/link";
import { TicketX } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";

export default function TicketNotFound() {
  return (
    <main className="container-page py-16">
      <EmptyState
        icon={<TicketX className="h-6 w-6" />}
        title="Ticket not found"
        description="This ticket may not exist, or you don't have access to it."
      />
      <div className="mt-6 text-center">
        <Link href="/tickets" className="text-sm font-medium text-purple-700 hover:underline">
          Back to My Tickets
        </Link>
      </div>
    </main>
  );
}
