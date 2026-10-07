import "server-only";
import { createClient } from "@/lib/supabase/server";
import type {
  VenueFilters,
  VenueRecord,
  VenueSortOption,
  VenueType,
  VenueWithDetails,
  VenueAvailabilityDay,
} from "@/types/venue";

const DEFAULT_PAGE_SIZE = 9;

const sortColumn: Record<VenueSortOption, { column: string; ascending: boolean }> = {
  recommended: { column: "rating_avg", ascending: false },
  price_asc: { column: "starting_price", ascending: true },
  price_desc: { column: "starting_price", ascending: false },
  rating_desc: { column: "rating_avg", ascending: false },
  capacity_desc: { column: "capacity_max", ascending: false },
  newest: { column: "created_at", ascending: false },
};

/**
 * Fetches published, publicly-visible venues with filters, sorting
 * and pagination applied at the database level.
 */
export async function getVenues(filters: VenueFilters): Promise<{
  venues: VenueRecord[];
  count: number;
  page: number;
  pageSize: number;
}> {
  const supabase = createClient();
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = filters.pageSize ?? DEFAULT_PAGE_SIZE;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const { column, ascending } = sortColumn[filters.sort ?? "recommended"];

  let query = supabase
    .from("venues")
    .select("*", { count: "exact" })
    .eq("status", "published")
    .eq("visibility", "public");

  if (filters.q) {
    query = query.or(
      `name.ilike.%${filters.q}%,description.ilike.%${filters.q}%,city.ilike.%${filters.q}%`
    );
  }
  if (filters.city) {
    query = query.ilike("city", `%${filters.city}%`);
  }
  if (filters.venueType) {
    query = query.eq("venue_type", filters.venueType);
  }
  if (typeof filters.minCapacity === "number") {
    query = query.gte("capacity_max", filters.minCapacity);
  }
  if (typeof filters.minPrice === "number") {
    query = query.gte("starting_price", filters.minPrice);
  }
  if (typeof filters.maxPrice === "number") {
    query = query.lte("starting_price", filters.maxPrice);
  }
  if (typeof filters.minRating === "number") {
    query = query.gte("rating_avg", filters.minRating);
  }
  if (filters.amenities && filters.amenities.length > 0) {
    // `amenities` is a text[] column — `contains` requires every
    // selected amenity to be present on the venue (AND semantics).
    query = query.contains("amenities", filters.amenities);
  }

  // Availability: exclude venues that are explicitly booked/blocked
  // on the requested date. Venues with no row for that date are
  // treated as open by default, so this can't be expressed as a
  // single chained filter — resolve the excluded IDs first.
  if (filters.availableOn) {
    const { data: unavailable } = await supabase
      .from("venue_availability")
      .select("venue_id")
      .eq("date", filters.availableOn)
      .in("status", ["booked", "blocked"]);

    const excludedIds = (unavailable ?? []).map((row) => row.venue_id);
    if (excludedIds.length > 0) {
      query = query.not("id", "in", `(${excludedIds.join(",")})`);
    }
  }

  query = query.order(column, { ascending }).range(from, to);

  const { data, error, count } = await query;

  if (error) {
    console.error("getVenues:", error.message);
    return { venues: [], count: 0, page, pageSize };
  }

  return { venues: (data as VenueRecord[]) ?? [], count: count ?? 0, page, pageSize };
}

export async function getVenueBySlugOrId(idOrSlug: string): Promise<VenueWithDetails | null> {
  const supabase = createClient();
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);

  const { data, error } = await supabase
    .from("venues")
    .select(
      `*,
       venue_images(*),
       venue_availability(*),
       venue_reviews(*)`
    )
    .eq(isUuid ? "id" : "slug", idOrSlug)
    .maybeSingle();

  if (error) {
    console.error("getVenueBySlugOrId:", error.message);
    return null;
  }
  if (!data) return null;

  return {
    ...(data as unknown as VenueWithDetails),
    venue_images: (data.venue_images ?? []).sort(
      (a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order
    ),
    venue_availability: (data.venue_availability ?? []).sort(
      (a: VenueAvailabilityDay, b: VenueAvailabilityDay) => a.date.localeCompare(b.date)
    ),
    venue_reviews: (data.venue_reviews ?? []).sort(
      (a: { created_at: string }, b: { created_at: string }) =>
        b.created_at.localeCompare(a.created_at)
    ),
  };
}

export async function getSimilarVenues(
  venueType: VenueType,
  excludeId: string,
  limit = 3
): Promise<VenueRecord[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("venues")
    .select("*")
    .eq("status", "published")
    .eq("visibility", "public")
    .eq("venue_type", venueType)
    .neq("id", excludeId)
    .order("rating_avg", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("getSimilarVenues:", error.message);
    return [];
  }
  return (data as VenueRecord[]) ?? [];
}

export async function getFavoriteVenueIds(userId: string): Promise<Set<string>> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("venue_favorites")
    .select("venue_id")
    .eq("user_id", userId);

  if (error) {
    console.error("getFavoriteVenueIds:", error.message);
    return new Set();
  }
  return new Set((data ?? []).map((f) => f.venue_id));
}
