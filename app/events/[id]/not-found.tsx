import Link from "next/link";
import { CalendarX } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";

export default function EventNotFound() {
  return (
    <main className="container-page py-16">
      <EmptyState
        icon={<CalendarX className="h-6 w-6" />}
        title="Event not found"
        description="This event may have been removed, or the link is incorrect."
      />
      <div className="mt-6 text-center">
        <Link href="/events" className="text-sm font-medium text-purple-700 hover:underline">
          Browse all events
        </Link>
      </div>
    </main>
  );
}
