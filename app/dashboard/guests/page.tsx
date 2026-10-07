import type { Metadata } from "next";
import Link from "next/link";
import { Users, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatCard } from "@/components/dashboard/StatCard";
import { getCurrentUser } from "@/lib/auth";
import { getUserEvents } from "@/lib/data/planner";
import { getGuestsByEvent, aggregateRsvp, RSVP_BADGE_VARIANT } from "@/lib/data/dashboard";
import { RSVP_STATUS_OPTIONS } from "@/types/guest";

export const metadata: Metadata = { title: "Guests" };

export default async function DashboardGuestsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const events = await getUserEvents(user.id);
  const groups = await getGuestsByEvent(events);
  const totals = aggregateRsvp(groups);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <div>
        <h2 className="text-2xl font-medium">Guests</h2>
        <p className="mt-1 text-sm text-charcoal-400">
          RSVP overview across all of your events. Manage a guest list from its event.
        </p>
      </div>

      {totals.total === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={<Users className="h-5 w-5" />}
            title="No guests yet"
            description="Add guests from an event's planner to track RSVPs, meal preferences and seating."
            className="mb-2"
          />
          <div className="text-center">
            <Link href="/dashboard/events">
              <Button variant="outline" size="sm">
                Go to my events
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={Users} label="Total guests" value={String(totals.total)} />
            <StatCard icon={Users} label="Confirmed" value={String(totals.confirmed)} />
            <StatCard icon={Users} label="Invited" value={String(totals.invited)} />
            <StatCard icon={Users} label="Headcount" value={String(totals.headcount)} />
          </div>

          <div className="mt-8 space-y-4">
            {groups.map((group) => (
              <Card key={group.event.id}>
                <CardContent className="p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="font-medium text-charcoal">{group.event.title}</h3>
                      <p className="text-sm text-charcoal-400">
                        {group.summary.total} guests · {group.summary.headcount} headcount
                      </p>
                    </div>
                    <Link href={`/dashboard/events/${group.event.id}/guests`}>
                      <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="h-4 w-4" />}>
                        Manage
                      </Button>
                    </Link>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {RSVP_STATUS_OPTIONS.map((status) => (
                      <Badge key={status.value} variant={RSVP_BADGE_VARIANT[status.value]}>
                        {status.label}: {group.summary[status.value]}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </main>
  );
}
