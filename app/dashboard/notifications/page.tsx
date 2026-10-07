import type { Metadata } from "next";
import Link from "next/link";
import { Bell } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata: Metadata = { title: "Notifications" };

export default function DashboardNotificationsPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-2xl font-medium">Notifications</h2>
        <Badge variant="gold">Coming soon</Badge>
      </div>
      <p className="mt-1 text-sm text-charcoal-400">
        Booking updates, payment updates, RSVP changes, new messages and event reminders.
      </p>

      <div className="mt-6">
        <EmptyState
          icon={<Bell className="h-5 w-5" />}
          title="No notifications yet"
          description="Alerts for booking, payment, RSVP and message activity will show up here as your events progress."
          className="mb-2"
        />
        <div className="flex justify-center">
          <Link href="/dashboard">
            <Button variant="outline" size="sm">
              Back to dashboard
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
