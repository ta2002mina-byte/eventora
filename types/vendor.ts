export type VendorCategory =
  | "photography"
  | "videography"
  | "catering"
  | "decoration"
  | "dj_music"
  | "makeup"
  | "security"
  | "transport"
  | "event_planner"
  | "other";

export const VENDOR_CATEGORY_LABELS: Record<VendorCategory, string> = {
  photography: "Photography",
  videography: "Videography",
  catering: "Catering",
  decoration: "Decoration",
  dj_music: "DJ/Music",
  makeup: "Makeup",
  security: "Security",
  transport: "Transport",
  event_planner: "Event Planner",
  other: "Other",
};

export const VENDOR_CATEGORY_OPTIONS: { value: VendorCategory; label: string }[] = (
  Object.keys(VENDOR_CATEGORY_LABELS) as VendorCategory[]
).map((value) => ({ value, label: VENDOR_CATEGORY_LABELS[value] }));

export type VendorStatus = "draft" | "published" | "archived";

export interface VendorRecord {
  id: string;
  owner_id: string | null;
  business_name: string;
  slug: string;
  category: VendorCategory;
  description: string | null;
  cover_image_url: string | null;
  logo_url: string | null;
  city: string | null;
  address: string | null;
  service_area: string[];
  starting_price: number;
  currency: string;
  years_experience: number;
  response_time_hours: number | null;
  contact_email: string | null;
  contact_phone: string | null;
  rating_avg: number;
  rating_count: number;
  status: VendorStatus;
  visibility: "public" | "private";
  created_at: string;
  updated_at: string;
}

export interface VendorService {
  id: string;
  vendor_id: string;
  name: string;
  description: string | null;
  price: number;
  unit: string | null; // e.g. "per event", "per hour", "per person"
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface VendorPackage {
  id: string;
  vendor_id: string;
  name: string;
  description: string | null;
  price: number;
  duration: string | null; // e.g. "Full day", "4 hours"
  included_services: string[];
  is_popular: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface VendorPortfolioItem {
  id: string;
  vendor_id: string;
  image_url: string;
  project_name: string | null;
  caption: string | null;
  sort_order: number;
  created_at: string;
}

export interface VendorAvailabilityDay {
  id: string;
  vendor_id: string;
  date: string; // yyyy-mm-dd
  status: "available" | "booked" | "blocked";
  note: string | null;
}

export interface VendorReview {
  id: string;
  vendor_id: string;
  user_id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  created_at: string;
}

export interface VendorWithDetails extends VendorRecord {
  vendor_services: VendorService[];
  vendor_packages: VendorPackage[];
  vendor_portfolio: VendorPortfolioItem[];
  vendor_availability: VendorAvailabilityDay[];
  vendor_reviews: VendorReview[];
}

export type VendorSortOption =
  | "recommended"
  | "price_asc"
  | "price_desc"
  | "rating_desc"
  | "experience_desc"
  | "newest";

export interface VendorFilters {
  q?: string;
  city?: string;
  category?: VendorCategory;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  availableOn?: string; // yyyy-mm-dd
  sort?: VendorSortOption;
  page?: number;
  pageSize?: number;
}

export interface VendorBookingRecord {
  id: string;
  vendor_id: string;
  user_id: string;
  event_name: string;
  service_name: string | null;
  package_id: string | null;
  event_date: string;
  guest_count: number;
  budget: number | null;
  amount: number | null;
  payment_status: "pending" | "paid" | "refunded";
  notes: string | null;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  responded_at: string | null;
  created_at: string;
}

export const VENDOR_BOOKING_STATUS_LABELS: Record<VendorBookingRecord["status"], string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
  completed: "Completed",
};

export function formatVendorPrice(vendor: Pick<VendorRecord, "starting_price" | "currency">) {
  return vendor.starting_price > 0
    ? `${vendor.currency} ${vendor.starting_price.toLocaleString()}`
    : "Contact for pricing";
}

export function formatVendorExperience(vendor: Pick<VendorRecord, "years_experience">) {
  if (!vendor.years_experience) return "New to Eventora";
  return `${vendor.years_experience} yr${vendor.years_experience === 1 ? "" : "s"} experience`;
}

export function formatResponseTime(hours: number | null) {
  if (!hours) return null;
  if (hours < 1) return "Responds within minutes";
  if (hours <= 24) return `Responds within ${hours} hr${hours === 1 ? "" : "s"}`;
  return `Responds within ${Math.round(hours / 24)} day${Math.round(hours / 24) === 1 ? "" : "s"}`;
}
