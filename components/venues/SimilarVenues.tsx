import { VenueCard } from "@/components/venues/VenueCard";
import type { VenueRecord } from "@/types/venue";

export function SimilarVenues({
  venues,
  favoriteIds,
}: {
  venues: VenueRecord[];
  favoriteIds: Set<string>;
}) {
  if (venues.length === 0) return null;

  return (
    <div className="mt-12">
      <h2 className="text-xl">Similar venues</h2>
      <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {venues.map((venue) => (
          <VenueCard key={venue.id} venue={venue} favorited={favoriteIds.has(venue.id)} />
        ))}
      </div>
    </div>
  );
}
