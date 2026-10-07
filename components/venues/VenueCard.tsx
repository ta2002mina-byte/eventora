import Link from "next/link";
import { MapPin, Star, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { VenueFavoriteButton } from "@/components/venues/VenueFavoriteButton";
import { VENUE_TYPE_LABELS, formatCapacity, formatVenuePrice } from "@/types/venue";
import type { VenueRecord } from "@/types/venue";

export function VenueCard({
  venue,
  favorited = false,
}: {
  venue: VenueRecord;
  favorited?: boolean;
}) {
  const visibleAmenities = venue.amenities.slice(0, 3);
  const extraAmenities = venue.amenities.length - visibleAmenities.length;

  return (
    <Link href={`/venues/${venue.slug}`} className="block h-full">
      <Card hoverable className="flex h-full flex-col overflow-hidden">
        <div className="relative flex h-40 items-center justify-center bg-gradient-to-br from-gold-100 to-lavender-100">
          <span className="font-display text-2xl italic text-purple-700">
            {venue.name.split(" ")[0]}
          </span>
          <VenueFavoriteButton
            venueId={venue.id}
            initialFavorited={favorited}
            className="absolute right-3 top-3"
          />
          {venue.rating_count > 0 && (
            <Badge variant="gold" className="absolute left-3 top-3">
              <Star className="h-3 w-3 fill-current" /> {venue.rating_avg.toFixed(1)}
            </Badge>
          )}
        </div>

        <CardContent className="flex flex-1 flex-col">
          <div className="flex items-center justify-between gap-2">
            <Badge variant="purple">{VENUE_TYPE_LABELS[venue.venue_type]}</Badge>
            <span className="text-sm font-medium text-purple-700">
              From {formatVenuePrice(venue)}
            </span>
          </div>

          <h3 className="mt-3 line-clamp-2 text-base font-medium text-charcoal">{venue.name}</h3>

          <div className="mt-3 space-y-1.5 text-sm text-charcoal-400">
            {(venue.address || venue.city) && (
              <p className="flex items-center gap-2">
                <MapPin className="h-4 w-4 shrink-0" />
                <span className="line-clamp-1">
                  {[venue.address, venue.city].filter(Boolean).join(", ")}
                </span>
              </p>
            )}
            <p className="flex items-center gap-2">
              <Users className="h-4 w-4 shrink-0" />
              {formatCapacity(venue)}
            </p>
          </div>

          {visibleAmenities.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {visibleAmenities.map((a) => (
                <Badge key={a} variant="gray">
                  {a}
                </Badge>
              ))}
              {extraAmenities > 0 && <Badge variant="gray">+{extraAmenities} more</Badge>}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
