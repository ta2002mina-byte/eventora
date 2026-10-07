import Link from "next/link";
import { Building2 } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";

export default function VenueNotFound() {
  return (
    <main className="container-page py-16">
      <EmptyState
        icon={<Building2 className="h-6 w-6" />}
        title="Venue not found"
        description="This venue may have been removed, or the link is incorrect."
      />
      <div className="mt-6 text-center">
        <Link href="/venues" className="text-sm font-medium text-purple-700 hover:underline">
          Browse all venues
        </Link>
      </div>
    </main>
  );
}
