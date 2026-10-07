import Link from "next/link";
import Image from "next/image";
import { CalendarDays, MapPin, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { FavoriteButton } from "@/components/events/FavoriteButton";
import type { EventRecord } from "@/types/event";

function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function EventCard({
  event,
  favorited = false,
}: {
  event: EventRecord;
  favorited?: boolean;
}) {
  const ticketTypes = event.event_ticket_types ?? [];
  const soldOut =
    ticketTypes.length > 0 &&
    ticketTypes.every((t) => t.quantity_total - t.quantity_sold <= 0);

  return (
    <Link href={`/events/${event.slug}`} className="block h-full">
      <Card hoverable className="flex h-full flex-col overflow-hidden">
        <div className="relative flex h-40 items-center justify-center overflow-hidden bg-gradient-to-br from-purple-100 to-lavender-100">
          {event.cover_image_url ? (
            <Image
              src={event.cover_image_url}
              alt=""
              fill
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover"
            />
          ) : (
            <span className="font-display text-2xl italic text-purple-700">
              {event.event_categories?.name ?? "Event"}
            </span>
          )}
          <FavoriteButton
            eventId={event.id}
            initialFavorited={favorited}
            className="absolute right-3 top-3"
          />
          {soldOut && (
            <Badge variant="danger" className="absolute left-3 top-3">
              Sold out
            </Badge>
          )}
        </div>

        <CardContent className="flex flex-1 flex-col">
          <div className="flex items-center justify-between gap-2">
            {event.event_categories && <Badge variant="purple">{event.event_categories.name}</Badge>}
            <span className="text-sm font-medium text-purple-700">
              {event.starting_price > 0
                ? `From ${event.currency} ${event.starting_price.toLocaleString()}`
                : "Free"}
            </span>
          </div>

          <h3 className="mt-3 line-clamp-2 text-base font-medium text-charcoal">{event.title}</h3>

          <div className="mt-3 space-y-1.5 text-sm text-charcoal-400">
            <p className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 shrink-0" />
              {formatDate(event.start_date)}
              {event.start_time ? ` · ${event.start_time.slice(0, 5)}` : ""}
            </p>
            {(event.location_name || event.city) && (
              <p className="flex items-center gap-2">
                <MapPin className="h-4 w-4 shrink-0" />
                <span className="line-clamp-1">
                  {[event.location_name, event.city].filter(Boolean).join(", ")}
                </span>
              </p>
            )}
            {event.organizer_name && (
              <p className="flex items-center gap-2">
                <User className="h-4 w-4 shrink-0" />
                <span className="line-clamp-1">{event.organizer_name}</span>
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
