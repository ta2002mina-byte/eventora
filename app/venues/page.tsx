import type { Metadata } from "next";
import { Building2 } from "lucide-react";
import { getVenues, getFavoriteVenueIds } from "@/lib/data/venues";
import { getCurrentUser } from "@/lib/auth";
import { VenueFilters } from "@/components/venues/VenueFilters";
import { VenueCard } from "@/components/venues/VenueCard";
import { VenuesPagination } from "@/components/venues/VenuesPagination";
import { EmptyState } from "@/components/ui/EmptyState";
import type { VenueSortOption, VenueType } from "@/types/venue";

export const metadata: Metadata = { title: "Venues" };

const ALLOWED_SORTS: VenueSortOption[] = [
  "recommended",
  "price_asc",
  "price_desc",
  "rating_desc",
  "capacity_desc",
  "newest",
];

export default async function VenuesPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) {
  const page = Number(searchParams.page ?? "1") || 1;
  const sort = ALLOWED_SORTS.includes(searchParams.sort as VenueSortOption)
    ? (searchParams.sort as VenueSortOption)
    : "recommended";

  const user = await getCurrentUser();

  const { venues, count, pageSize } = await getVenues({
    q: searchParams.q,
    city: searchParams.city,
    venueType: (searchParams.venueType as VenueType) || undefined,
    minCapacity: searchParams.minCapacity ? Number(searchParams.minCapacity) : undefined,
    minPrice: searchParams.minPrice ? Number(searchParams.minPrice) : undefined,
    maxPrice: searchParams.maxPrice ? Number(searchParams.maxPrice) : undefined,
    minRating: searchParams.minRating ? Number(searchParams.minRating) : undefined,
    amenities: searchParams.amenities ? searchParams.amenities.split(",").filter(Boolean) : undefined,
    availableOn: searchParams.availableOn,
    sort,
    page,
  });

  const favoriteIds = user ? await getFavoriteVenueIds(user.id) : new Set<string>();
  const totalPages = Math.max(1, Math.ceil(count / pageSize));

  return (
    <main className="container-page py-10">
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl">Venues</h1>
        <p className="mt-2 text-charcoal-400">
          {count > 0
            ? `${count} venue${count === 1 ? "" : "s"} to explore`
            : "Find banquet halls, gardens, rooftops and more for your next event."}
        </p>
      </div>

      <VenueFilters />

      {venues.length === 0 ? (
        <EmptyState
          icon={<Building2 className="h-6 w-6" />}
          title="No venues match your filters"
          description="Try widening your price range or clearing a filter to see more venues."
        />
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {venues.map((venue) => (
              <VenueCard key={venue.id} venue={venue} favorited={favoriteIds.has(venue.id)} />
            ))}
          </div>
          <VenuesPagination page={page} totalPages={totalPages} />
        </>
      )}
    </main>
  );
}
