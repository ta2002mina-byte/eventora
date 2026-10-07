import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { CalendarDays, Clock, MapPin, User, Ticket as TicketIcon, ArrowLeft } from "lucide-react";
import { getEventBySlugOrId } from "@/lib/data/events";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { FavoriteButton } from "@/components/events/FavoriteButton";
import { ShareButton } from "@/components/events/ShareButton";
import { AddToCalendarButton } from "@/components/events/AddToCalendarButton";
import { EventReviews } from "@/components/events/EventReviews";
import { WriteReviewButton } from "@/components/reviews/WriteReviewButton";
import { StartConversationButton } from "@/components/messaging/StartConversationButton";
import { canReview } from "@/lib/data/reviews";
import { ticketAvailability, isEventSoldOut } from "@/types/event";

interface PageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const event = await getEventBySlugOrId(params.id);
  if (!event) return { title: "Event not found" };
  return {
    title: event.title,
    description: event.description?.slice(0, 155),
  };
}

function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(time?: string | null) {
  if (!time) return null;
  const [h, m] = time.split(":");
  const date = new Date();
  date.setHours(Number(h), Number(m));
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export default async function EventDetailPage({ params }: PageProps) {
  const event = await getEventBySlugOrId(params.id);
  if (!event) notFound();

  const user = await getCurrentUser();

  let favorited = false;
  if (user) {
    const supabase = createClient();
    const { data } = await supabase
      .from("favorites")
      .select("id")
      .eq("user_id", user.id)
      .eq("event_id", event.id)
      .maybeSingle();
    favorited = !!data;
  }

  const soldOut = isEventSoldOut(event.event_ticket_types);
  const location = [event.location_name, event.location_address, event.city]
    .filter(Boolean)
    .join(", ");

  const myEventReview = user ? event.event_reviews.find((r) => r.user_id === user.id) : undefined;
  const eventReviewEligible = user ? await canReview("event", event.id, user.id) : false;

  return (
    <main className="container-page py-10">
      <Link
        href="/events"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-charcoal-400 hover:text-purple-700"
      >
        <ArrowLeft className="h-4 w-4" /> Back to events
      </Link>

      {/* Gallery band: shows the organizer's uploaded cover image, or a
          styled placeholder when none was provided. */}
      <div className="relative flex h-56 items-center justify-center overflow-hidden rounded-card bg-gradient-to-br from-purple-100 to-lavender-100 sm:h-72">
        {event.cover_image_url ? (
          <Image
            src={event.cover_image_url}
            alt={event.title}
            fill
            sizes="(min-width: 640px) 768px, 100vw"
            className="object-cover"
            priority
          />
        ) : (
          <span className="font-display text-3xl italic text-purple-700 sm:text-4xl">
            {event.event_categories?.name ?? event.title}
          </span>
        )}
        {soldOut && (
          <Badge variant="danger" className="absolute left-4 top-4">
            Sold out
          </Badge>
        )}
        <FavoriteButton
          eventId={event.id}
          initialFavorited={favorited}
          className="absolute right-4 top-4"
        />
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_320px]">
        <div>
          {event.event_categories && <Badge variant="purple">{event.event_categories.name}</Badge>}
          <h1 className="mt-3 text-3xl sm:text-4xl">{event.title}</h1>

          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-charcoal-600">
            <span className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-purple-600" />
              {formatDate(event.start_date)}
            </span>
            {event.start_time && (
              <span className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-purple-600" />
                {formatTime(event.start_time)}
                {event.end_time ? ` – ${formatTime(event.end_time)}` : ""}
              </span>
            )}
            {location && (
              <span className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-purple-600" />
                {location}
              </span>
            )}
            {event.organizer_name && (
              <span className="flex items-center gap-2">
                <User className="h-4 w-4 text-purple-600" />
                {event.organizer_name}
              </span>
            )}
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <ShareButton title={event.title} />
            <AddToCalendarButton
              title={event.title}
              description={event.description}
              location={location}
              startDate={event.start_date}
              startTime={event.start_time}
              endDate={event.end_date}
              endTime={event.end_time}
            />
          </div>

          {event.description && (
            <div className="mt-8">
              <h2 className="text-xl">About this event</h2>
              <p className="mt-3 whitespace-pre-line text-charcoal-600">{event.description}</p>
            </div>
          )}

          {event.event_schedules.length > 0 && (
            <div className="mt-8">
              <h2 className="text-xl">Schedule</h2>
              <ol className="mt-4 space-y-4 border-l border-border pl-5">
                {event.event_schedules.map((item) => (
                  <li key={item.id} className="relative">
                    <span className="absolute -left-[1.4rem] top-1 h-2.5 w-2.5 rounded-full bg-purple-600" />
                    <p className="text-sm font-medium text-charcoal">
                      {item.title}
                      {item.start_time && (
                        <span className="ml-2 font-normal text-charcoal-400">
                          {formatTime(item.start_time)}
                          {item.end_time ? ` – ${formatTime(item.end_time)}` : ""}
                        </span>
                      )}
                    </p>
                    {item.description && (
                      <p className="mt-1 text-sm text-charcoal-400">{item.description}</p>
                    )}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {location && (
            <div className="mt-8">
              <h2 className="text-xl">Venue</h2>
              <p className="mt-2 flex items-center gap-2 text-charcoal-600">
                <MapPin className="h-4 w-4 text-purple-600" /> {location}
              </p>
            </div>
          )}

          <div className="mt-10">
            <h2 className="text-xl">Reviews</h2>
            <div className="mt-4">
              <EventReviews
                reviews={event.event_reviews}
                ratingAvg={event.rating_avg}
                ratingCount={event.rating_count}
                action={
                  <WriteReviewButton
                    isAuthenticated={!!user}
                    eligible={eventReviewEligible}
                    type="event"
                    targetId={event.id}
                    existingReview={myEventReview}
                  />
                }
              />
            </div>
          </div>
        </div>

        <aside className="h-fit rounded-card border border-border bg-white p-5 shadow-softer lg:sticky lg:top-24">
          <h2 className="flex items-center gap-2 text-base font-medium text-charcoal">
            <TicketIcon className="h-4 w-4 text-purple-600" /> Tickets
          </h2>

          {event.event_ticket_types.length === 0 ? (
            <p className="mt-3 text-sm text-charcoal-400">
              Starting from {event.currency} {event.starting_price.toLocaleString()}
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {event.event_ticket_types.map((ticket) => {
                const remaining = ticketAvailability(ticket);
                const ticketSoldOut = remaining <= 0;
                return (
                  <li
                    key={ticket.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border p-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-charcoal">{ticket.name}</p>
                      <p className="text-xs text-charcoal-400">
                        {ticketSoldOut ? "Sold out" : `${remaining} left`}
                      </p>
                    </div>
                    <span className="text-sm font-medium text-purple-700">
                      {ticket.price > 0
                        ? `${event.currency} ${ticket.price.toLocaleString()}`
                        : "Free"}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}

          {soldOut ? (
            <Button className="mt-5 w-full" disabled>
              Sold Out
            </Button>
          ) : (
            <Link href={`/booking/${event.id}`} className="mt-5 block">
              <Button className="w-full">Get Tickets</Button>
            </Link>
          )}
          <p className="mt-2 text-center text-xs text-charcoal-400">
            Checkout arrives in the Booking &amp; Payment phase.
          </p>

          {event.organizer_id && (
            <div className="mt-3">
              <StartConversationButton
                isAuthenticated={!!user}
                contextType="event"
                contextId={event.id}
                recipientId={event.organizer_id}
                recipientRole="organizer"
                recipientName={event.organizer_name ?? "the organizer"}
                label="Message Organizer"
                className="w-full"
              />
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}
