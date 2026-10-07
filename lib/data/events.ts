import "server-only";
import { createClient } from "@/lib/supabase/server";
import type {
  EventCategory,
  EventFilters,
  EventRecord,
  EventSortOption,
  EventWithDetails,
} from "@/types/event";

const DEFAULT_PAGE_SIZE = 9;

const sortColumn: Record<EventSortOption, { column: string; ascending: boolean }> = {
  date_asc: { column: "start_date", ascending: true },
  newest: { column: "created_at", ascending: false },
  price_asc: { column: "starting_price", ascending: true },
  price_desc: { column: "starting_price", ascending: false },
};

export async function getEventCategories(): Promise<EventCategory[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("event_categories")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("getEventCategories:", error.message);
    return [];
  }
  return data ?? [];
}

/**
 * Fetches published, publicly-visible events with filters, sorting
 * and pagination applied at the database level.
 */
export async function getEvents(filters: EventFilters): Promise<{
  events: EventRecord[];
  count: number;
  page: number;
  pageSize: number;
}> {
  const supabase = createClient();
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = filters.pageSize ?? DEFAULT_PAGE_SIZE;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const { column, ascending } = sortColumn[filters.sort ?? "date_asc"];

  // Filtering on an embedded resource's column only restricts the parent
  // rows when the embed is an inner join — otherwise PostgREST treats the
  // filter as a no-op on the parent query. Only request the inner join
  // when a category filter is actually set, so events without a category
  // still show up in the unfiltered list.
  const categoryEmbed = filters.category ? "event_categories!inner(*)" : "event_categories(*)";

  let query = supabase
    .from("events")
    .select(`*, ${categoryEmbed}, event_ticket_types(quantity_total, quantity_sold)`, {
      count: "exact",
    })
    .eq("status", "published")
    .eq("visibility", "public");

  if (filters.q) {
    query = query.or(
      `title.ilike.%${filters.q}%,description.ilike.%${filters.q}%,city.ilike.%${filters.q}%`
    );
  }
  if (filters.category) {
    query = query.eq("event_categories.slug", filters.category);
  }
  if (filters.city) {
    query = query.ilike("city", `%${filters.city}%`);
  }
  if (filters.dateFrom) {
    query = query.gte("start_date", filters.dateFrom);
  } else {
    // Hide past events by default.
    query = query.gte("start_date", new Date().toISOString().slice(0, 10));
  }
  if (typeof filters.minPrice === "number") {
    query = query.gte("starting_price", filters.minPrice);
  }
  if (typeof filters.maxPrice === "number") {
    query = query.lte("starting_price", filters.maxPrice);
  }

  query = query.order(column, { ascending }).range(from, to);

  const { data, error, count } = await query;

  if (error) {
    console.error("getEvents:", error.message);
    return { events: [], count: 0, page, pageSize };
  }

  return { events: (data as unknown as EventRecord[]) ?? [], count: count ?? 0, page, pageSize };
}

export async function getEventBySlugOrId(idOrSlug: string): Promise<EventWithDetails | null> {
  const supabase = createClient();
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);

  const { data, error } = await supabase
    .from("events")
    .select(
      "*, event_categories(*), event_schedules(*), event_ticket_types(*), event_reviews(*)"
    )
    .eq(isUuid ? "id" : "slug", idOrSlug)
    .maybeSingle();

  if (error) {
    console.error("getEventBySlugOrId:", error.message);
    return null;
  }
  if (!data) return null;

  return {
    ...(data as unknown as EventWithDetails),
    event_schedules: (data.event_schedules ?? []).sort(
      (a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order
    ),
    event_ticket_types: (data.event_ticket_types ?? []).sort(
      (a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order
    ),
    event_reviews: [...(data.event_reviews ?? [])].sort(
      (a: { created_at: string }, b: { created_at: string }) =>
        b.created_at.localeCompare(a.created_at)
    ),
  };
}

export async function getFavoriteEventIds(userId: string): Promise<Set<string>> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("favorites")
    .select("event_id")
    .eq("user_id", userId);

  if (error) {
    console.error("getFavoriteEventIds:", error.message);
    return new Set();
  }
  return new Set((data ?? []).map((f) => f.event_id));
}
