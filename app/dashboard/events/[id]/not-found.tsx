import Link from "next/link";
import { CalendarX } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";

export default function EventNotFound() {
  return (
    <main className="container-page py-16">
      <EmptyState
        icon={<CalendarX className="h-6 w-6" />}
        title="Event not found"
        description="This event may have been removed, or you don't have access to it."
      />
      <div className="mt-6 text-center">
        <Link href="/dashboard/events/create" className="text-sm font-medium text-purple-700 hover:underline">
          Create a new event
        </Link>
      </div>
    </main>
  );
}
