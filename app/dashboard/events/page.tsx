import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, MapPin, Plus, Sparkles, Users, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { getCurrentUser } from "@/lib/auth";
import { getUserEvents } from "@/lib/data/planner";

export const metadata: Metadata = { title: "My Events" };

function formatDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

const statusVariant = {
  draft: "gray",
  published: "success",
  cancelled: "danger",
} as const;

export default async function DashboardEventsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const events = await getUserEvents(user.id);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-medium">My Events</h2>
          <p className="mt-1 text-sm text-charcoal-400">
            {events.length} {events.length === 1 ? "event" : "events"} in your account
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/ai-planner">
            <Button variant="outline" leftIcon={<Sparkles className="h-4 w-4" />}>
              Plan with AI
            </Button>
          </Link>
          <Link href="/dashboard/events/create">
            <Button leftIcon={<Plus className="h-4 w-4" />}>Create event</Button>
          </Link>
        </div>
      </div>

      {events.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={<CalendarDays className="h-5 w-5" />}
            title="No events yet"
            description="Create your first event manually, or let the AI Planner build a full plan for you."
          />
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {events.map((event) => (
            <Card key={event.id} hoverable>
              <Link href={`/dashboard/events/${event.id}`} className="block">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="purple">{event.event_type ?? "Event"}</Badge>
                    <Badge variant={statusVariant[event.status]}>{event.status}</Badge>
                  </div>
                  <h3 className="mt-3 truncate text-lg font-medium text-charcoal">{event.title}</h3>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-charcoal-400">
                    <span className="flex items-center gap-1.5">
                      <CalendarDays className="h-4 w-4" /> {formatDate(event.start_date)}
                    </span>
                    {(event.location_name || event.city) && (
                      <span className="flex items-center gap-1.5">
                        <MapPin className="h-4 w-4" /> {event.location_name ?? event.city}
                      </span>
                    )}
                    {event.guest_count ? (
                      <span className="flex items-center gap-1.5">
                        <Users className="h-4 w-4" /> {event.guest_count}
                      </span>
                    ) : null}
                  </div>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-purple-700">
                    Open planner <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </CardContent>
              </Link>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
