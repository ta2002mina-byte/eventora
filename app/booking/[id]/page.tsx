import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { getCurrentUser } from "@/lib/auth";
import { getEventBySlugOrId } from "@/lib/data/events";
import { isEventSoldOut } from "@/types/event";
import { BookingForm } from "@/components/booking/BookingForm";

interface PageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const event = await getEventBySlugOrId(params.id);
  return { title: event ? `Get Tickets — ${event.title}` : "Get Tickets" };
}

function formatDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

export default async function BookingPage({ params }: PageProps) {
  const event = await getEventBySlugOrId(params.id);
  if (!event) notFound();
  if (event.status !== "published" || event.visibility !== "public") notFound();

  const user = await getCurrentUser();
  const soldOut = isEventSoldOut(event.event_ticket_types);
  const location = event.location_name ?? event.city;

  return (
    <main className="container-page py-10 sm:py-14">
      <Link
        href={`/events/${event.id}`}
        className="inline-flex items-center gap-1.5 text-sm text-charcoal-400 hover:text-purple-700"
      >
        <ArrowLeft className="h-4 w-4" /> Back to event
      </Link>

      <div className="mx-auto mt-6 max-w-2xl">
        <div className="flex flex-wrap items-center gap-2">
          {event.event_categories && <Badge variant="purple">{event.event_categories.name}</Badge>}
        </div>
        <h1 className="mt-2 text-3xl font-medium">{event.title}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-charcoal-400">
          <span className="flex items-center gap-1.5">
            <CalendarDays className="h-4 w-4" /> {formatDate(event.start_date)}
          </span>
          {location && (
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4" /> {location}
            </span>
          )}
        </div>

        <div className="mt-8 rounded-card border border-border bg-white p-6 shadow-softer">
          {soldOut ? (
            <EmptyState title="Sold out" description="All tickets for this event have been claimed." />
          ) : !user ? (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <p className="text-sm text-charcoal-600">Sign in to get tickets for this event.</p>
              <Link href="/auth/login">
                <Button size="sm">Sign In</Button>
              </Link>
            </div>
          ) : (
            <BookingForm
              eventId={event.id}
              currency={event.currency}
              startingPrice={event.starting_price}
              ticketTypes={event.event_ticket_types}
              defaultEmail={user.email ?? undefined}
            />
          )}
        </div>
      </div>
    </main>
  );
}
