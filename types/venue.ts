export type VenueType =
  | "banquet_hall"
  | "hotel"
  | "garden"
  | "rooftop"
  | "restaurant"
  | "community_center"
  | "resort"
  | "other";

export const VENUE_TYPE_LABELS: Record<VenueType, string> = {
  banquet_hall: "Banquet Hall",
  hotel: "Hotel",
  garden: "Garden",
  rooftop: "Rooftop",
  restaurant: "Restaurant",
  community_center: "Community Center",
  resort: "Resort",
  other: "Other",
};

export const VENUE_TYPE_OPTIONS: { value: VenueType; label: string }[] = (
  Object.keys(VENUE_TYPE_LABELS) as VenueType[]
).map((value) => ({ value, label: VENUE_TYPE_LABELS[value] }));

/**
 * Fixed amenity list shown in filters and the booking-request form.
 * `venues.amenities` (a denormalized text[]) is filtered against this
 * set, while `venue_amenities` rows back the detail-page checklist.
 */
export const VENUE_AMENITIES = [
  "AC",
  "Parking",
  "Catering",
  "Sound System",
  "Stage",
  "Decor",
  "Green Room",
  "Generator",
  "WiFi",
] as const;

export type VenueAmenity = (typeof VENUE_AMENITIES)[number];

export type VenueStatus = "draft" | "published" | "archived";

export interface VenueRecord {
  id: string;
  owner_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  cover_image_url: string | null;
  venue_type: VenueType;
  city: string | null;
  address: string | null;
  capacity_min: number;
  capacity_max: number;
  starting_price: number;
  currency: string;
  amenities: string[];
  rules: string | null;
  rating_avg: number;
  rating_count: number;
  status: VenueStatus;
  visibility: "public" | "private";
  created_at: string;
  updated_at: string;
}

export interface VenueImage {
  id: string;
  venue_id: string;
  image_url: string;
  alt_text: string | null;
  sort_order: number;
}

export interface VenueAvailabilityDay {
  id: string;
  venue_id: string;
  date: string; // yyyy-mm-dd
  status: "available" | "booked" | "blocked";
  note: string | null;
}

export interface VenueReview {
  id: string;
  venue_id: string;
  user_id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  created_at: string;
}

export interface VenueWithDetails extends VenueRecord {
  venue_images: VenueImage[];
  venue_availability: VenueAvailabilityDay[];
  venue_reviews: VenueReview[];
}

export type VenueSortOption =
  | "recommended"
  | "price_asc"
  | "price_desc"
  | "rating_desc"
  | "capacity_desc"
  | "newest";

export interface VenueFilters {
  q?: string;
  city?: string;
  venueType?: VenueType;
  minCapacity?: number;
  minPrice?: number;
  maxPrice?: number;
  amenities?: string[];
  minRating?: number;
  availableOn?: string; // yyyy-mm-dd
  sort?: VenueSortOption;
  page?: number;
  pageSize?: number;
}

export interface VenueBookingRecord {
  id: string;
  venue_id: string;
  user_id: string;
  event_name: string;
  event_date: string;
  event_time: string | null;
  guest_count: number;
  notes: string | null;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  created_at: string;
}

export function formatVenuePrice(venue: Pick<VenueRecord, "starting_price" | "currency">) {
  return venue.starting_price > 0
    ? `${venue.currency} ${venue.starting_price.toLocaleString()}`
    : "Contact for pricing";
}

export function formatCapacity(venue: Pick<VenueRecord, "capacity_min" | "capacity_max">) {
  if (!venue.capacity_min && !venue.capacity_max) return "Flexible";
  if (venue.capacity_min && venue.capacity_max) {
    return `${venue.capacity_min}–${venue.capacity_max} guests`;
  }
  return `Up to ${venue.capacity_max || venue.capacity_min} guests`;
}
