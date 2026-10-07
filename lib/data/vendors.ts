import "server-only";
import { createClient } from "@/lib/supabase/server";
import type {
  VendorCategory,
  VendorFilters,
  VendorRecord,
  VendorSortOption,
  VendorWithDetails,
  VendorAvailabilityDay,
} from "@/types/vendor";

const DEFAULT_PAGE_SIZE = 9;

const sortColumn: Record<VendorSortOption, { column: string; ascending: boolean }> = {
  recommended: { column: "rating_avg", ascending: false },
  price_asc: { column: "starting_price", ascending: true },
  price_desc: { column: "starting_price", ascending: false },
  rating_desc: { column: "rating_avg", ascending: false },
  experience_desc: { column: "years_experience", ascending: false },
  newest: { column: "created_at", ascending: false },
};

/**
 * Fetches published, publicly-visible vendors with filters, sorting
 * and pagination applied at the database level.
 */
export async function getVendors(filters: VendorFilters): Promise<{
  vendors: VendorRecord[];
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
    .from("vendors")
    .select("*", { count: "exact" })
    .eq("status", "published")
    .eq("visibility", "public");

  if (filters.q) {
    query = query.or(
      `business_name.ilike.%${filters.q}%,description.ilike.%${filters.q}%,city.ilike.%${filters.q}%`
    );
  }
  if (filters.city) {
    query = query.ilike("city", `%${filters.city}%`);
  }
  if (filters.category) {
    query = query.eq("category", filters.category);
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

  // Availability: exclude vendors explicitly booked/blocked on the
  // requested date. Vendors with no row for that date are treated as
  // open by default, so resolve the excluded IDs first (same approach
  // as venue availability filtering in Phase 04).
  if (filters.availableOn) {
    const { data: unavailable } = await supabase
      .from("vendor_availability")
      .select("vendor_id")
      .eq("date", filters.availableOn)
      .in("status", ["booked", "blocked"]);

    const excludedIds = (unavailable ?? []).map((row) => row.vendor_id);
    if (excludedIds.length > 0) {
      query = query.not("id", "in", `(${excludedIds.join(",")})`);
    }
  }

  query = query.order(column, { ascending }).range(from, to);

  const { data, error, count } = await query;

  if (error) {
    console.error("getVendors:", error.message);
    return { vendors: [], count: 0, page, pageSize };
  }

  return { vendors: (data as VendorRecord[]) ?? [], count: count ?? 0, page, pageSize };
}

export async function getVendorBySlugOrId(idOrSlug: string): Promise<VendorWithDetails | null> {
  const supabase = createClient();
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);

  const { data, error } = await supabase
    .from("vendors")
    .select(
      `*,
       vendor_services(*),
       vendor_packages(*),
       vendor_portfolio(*),
       vendor_availability(*),
       vendor_reviews(*)`
    )
    .eq(isUuid ? "id" : "slug", idOrSlug)
    .maybeSingle();

  if (error) {
    console.error("getVendorBySlugOrId:", error.message);
    return null;
  }
  if (!data) return null;

  return {
    ...(data as unknown as VendorWithDetails),
    vendor_services: (data.vendor_services ?? [])
      .filter((s: { is_active?: boolean }) => s.is_active !== false)
      .sort((a: { price: number }, b: { price: number }) => a.price - b.price),
    vendor_packages: (data.vendor_packages ?? [])
      .filter((p: { is_active?: boolean }) => p.is_active !== false)
      .sort((a: { price: number }, b: { price: number }) => a.price - b.price),
    vendor_portfolio: (data.vendor_portfolio ?? []).sort(
      (a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order
    ),
    vendor_availability: (data.vendor_availability ?? []).sort(
      (a: VendorAvailabilityDay, b: VendorAvailabilityDay) => a.date.localeCompare(b.date)
    ),
    vendor_reviews: (data.vendor_reviews ?? []).sort(
      (a: { created_at: string }, b: { created_at: string }) =>
        b.created_at.localeCompare(a.created_at)
    ),
  };
}

export async function getSimilarVendors(
  category: VendorCategory,
  excludeId: string,
  limit = 3
): Promise<VendorRecord[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("vendors")
    .select("*")
    .eq("status", "published")
    .eq("visibility", "public")
    .eq("category", category)
    .neq("id", excludeId)
    .order("rating_avg", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("getSimilarVendors:", error.message);
    return [];
  }
  return (data as VendorRecord[]) ?? [];
}

export async function getFavoriteVendorIds(userId: string): Promise<Set<string>> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("vendor_favorites")
    .select("vendor_id")
    .eq("user_id", userId);

  if (error) {
    console.error("getFavoriteVendorIds:", error.message);
    return new Set();
  }
  return new Set((data ?? []).map((f) => f.vendor_id));
}
