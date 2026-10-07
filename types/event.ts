export interface EventCategory {
  id: string;
  name: string;
  slug: string;
  icon: string;
  sort_order: number;
}

export interface EventTicketType {
  id: string;
  event_id: string;
  name: string;
  description: string | null;
  price: number;
  quantity_total: number;
  quantity_sold: number;
  sort_order: number;
}

export interface EventSchedule {
  id: string;
  event_id: string;
  title: string;
  description: string | null;
  start_time: string | null;
  end_time: string | null;
  sort_order: number;
}

export type EventStatus = "draft" | "published" | "cancelled";

export interface EventRecord {
  id: string;
  organizer_id: string | null;
  category_id: string | null;
  title: string;
  slug: string;
  description: string | null;
  cover_image_url: string | null;
  organizer_name: string | null;
  start_date: string;
  end_date: string | null;
  start_time: string | null;
  end_time: string | null;
  location_name: string | null;
  location_address: string | null;
  city: string | null;
  starting_price: number;
  currency: string;
  status: EventStatus;
  visibility: "public" | "private";
  created_at: string;
  updated_at: string;
  // Added in Phase 06 (Event Creation + AI Event Planner) for a
  // customer's own private/draft "planning" events. Nullable so
  // existing Phase 03 marketplace rows/queries are unaffected.
  event_type: string | null;
  guest_count: number | null;
  budget: number | null;
  theme: string | null;
  notes: string | null;
  event_categories?: EventCategory | null;
  event_ticket_types?: Pick<EventTicketType, "quantity_total" | "quantity_sold">[];
  // Added in Phase 11 (Messages + Reviews). Defaults to 0 for events
  // created before this migration until their first review lands.
  rating_avg: number;
  rating_count: number;
}

export interface EventReview {
  id: string;
  event_id: string;
  user_id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  status: "published" | "hidden";
  created_at: string;
  updated_at: string;
}

export interface EventWithDetails extends EventRecord {
  event_schedules: EventSchedule[];
  event_ticket_types: EventTicketType[];
  event_reviews: EventReview[];
}

export type EventSortOption = "date_asc" | "newest" | "price_asc" | "price_desc";

export interface EventFilters {
  q?: string;
  category?: string; // category slug
  city?: string;
  dateFrom?: string; // yyyy-mm-dd
  minPrice?: number;
  maxPrice?: number;
  sort?: EventSortOption;
  page?: number;
  pageSize?: number;
}

export function ticketAvailability(ticket: EventTicketType) {
  return Math.max(0, ticket.quantity_total - ticket.quantity_sold);
}

export function isEventSoldOut(ticketTypes: EventTicketType[]) {
  if (ticketTypes.length === 0) return false;
  return ticketTypes.every((t) => ticketAvailability(t) <= 0);
}
