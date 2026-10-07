import { ICON_OPTIONS } from "@/lib/icon-names";
import type { ChildResource, Field, Option, Resource } from "@/lib/admin/types";

const opts = (...values: string[]): Option[] =>
  values.map((v) => ({ value: v, label: v.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase()) }));

const PUBLISH_STATUS = opts("draft", "published", "archived");
const VISIBILITY = opts("public", "private");
const BOOKING_STATUS = opts("pending", "confirmed", "cancelled", "completed");

/* ------------------------------------------------------------------ */
/* Children                                                            */
/* ------------------------------------------------------------------ */

const ticketTypes: ChildResource = {
  key: "ticket-types",
  table: "event_ticket_types",
  label: "Ticket types",
  singular: "ticket type",
  fk: "event_id",
  titleField: "name",
  order: { column: "sort_order", ascending: true },
  summary: ["price", "quantity_sold", "quantity_total"],
  fields: [
    { name: "name", label: "Name", type: "text", required: true, placeholder: "General, VIP…" },
    { name: "price", label: "Price", type: "number", required: true, min: 0, step: 0.01 },
    { name: "quantity_total", label: "Total quantity", type: "number", required: true, min: 0, step: 1 },
    { name: "quantity_sold", label: "Sold", type: "number", min: 0, step: 1, defaultValue: 0, hint: "Edit only to correct the count." },
    { name: "sort_order", label: "Sort order", type: "number", step: 1, defaultValue: 0 },
    { name: "description", label: "Description", type: "textarea", full: true },
  ],
};

const schedules: ChildResource = {
  key: "schedule",
  table: "event_schedules",
  label: "Schedule / agenda",
  singular: "agenda item",
  fk: "event_id",
  titleField: "title",
  order: { column: "sort_order", ascending: true },
  summary: ["start_time", "end_time"],
  fields: [
    { name: "title", label: "Title", type: "text", required: true },
    { name: "start_time", label: "Start time", type: "time" },
    { name: "end_time", label: "End time", type: "time" },
    { name: "sort_order", label: "Sort order", type: "number", step: 1, defaultValue: 0 },
    { name: "description", label: "Description", type: "textarea", full: true },
  ],
};

const venueImages: ChildResource = {
  key: "images",
  table: "venue_images",
  label: "Gallery images",
  singular: "image",
  fk: "venue_id",
  titleField: "alt_text",
  order: { column: "sort_order", ascending: true },
  summary: ["sort_order"],
  fields: [
    { name: "image_url", label: "Image", type: "image", required: true, folder: "venues", full: true },
    { name: "alt_text", label: "Alt text", type: "text" },
    { name: "sort_order", label: "Sort order", type: "number", step: 1, defaultValue: 0 },
  ],
};

const vendorServices: ChildResource = {
  key: "services",
  table: "vendor_services",
  label: "Services",
  singular: "service",
  fk: "vendor_id",
  titleField: "name",
  order: { column: "created_at", ascending: true },
  summary: ["price", "unit", "is_active"],
  fields: [
    { name: "name", label: "Name", type: "text", required: true },
    { name: "price", label: "Price", type: "number", required: true, min: 0, step: 0.01 },
    { name: "unit", label: "Unit", type: "text", placeholder: "per event, per hour…" },
    { name: "is_active", label: "Active", type: "boolean", defaultValue: true },
    { name: "description", label: "Description", type: "textarea", full: true },
  ],
};

const vendorPackages: ChildResource = {
  key: "packages",
  table: "vendor_packages",
  label: "Packages",
  singular: "package",
  fk: "vendor_id",
  titleField: "name",
  order: { column: "created_at", ascending: true },
  summary: ["price", "duration", "is_popular"],
  fields: [
    { name: "name", label: "Name", type: "text", required: true },
    { name: "price", label: "Price", type: "number", required: true, min: 0, step: 0.01 },
    { name: "duration", label: "Duration", type: "text", placeholder: "Full day, 4 hours…" },
    { name: "is_popular", label: "Mark as popular", type: "boolean" },
    { name: "is_active", label: "Active", type: "boolean", defaultValue: true },
    { name: "included_services", label: "Included services (one per line)", type: "lines", full: true },
    { name: "description", label: "Description", type: "textarea", full: true },
  ],
};

const vendorPortfolio: ChildResource = {
  key: "portfolio",
  table: "vendor_portfolio",
  label: "Portfolio",
  singular: "portfolio item",
  fk: "vendor_id",
  titleField: "project_name",
  order: { column: "sort_order", ascending: true },
  summary: ["sort_order"],
  fields: [
    { name: "image_url", label: "Image", type: "image", folder: "vendors", full: true },
    { name: "project_name", label: "Project name", type: "text" },
    { name: "caption", label: "Caption", type: "text" },
    { name: "sort_order", label: "Sort order", type: "number", step: 1, defaultValue: 0 },
  ],
};

/* ------------------------------------------------------------------ */
/* Resources                                                           */
/* ------------------------------------------------------------------ */

const events: Resource = {
  key: "events",
  table: "events",
  label: "Events",
  singular: "event",
  description: "Marketplace events, their ticket types and agenda.",
  icon: "CalendarDays",
  titleField: "title",
  select: "*, event_categories(name)",
  list: [
    { name: "title", label: "Event" },
    { name: "event_categories.name", label: "Category" },
    { name: "city", label: "City" },
    { name: "start_date", label: "Date", kind: "date" },
    { name: "starting_price", label: "From", kind: "money" },
    { name: "status", label: "Status", kind: "badge" },
    { name: "is_featured", label: "Featured", kind: "bool", toggle: true },
  ],
  searchFields: ["title", "city", "organizer_name", "slug"],
  filters: [{ name: "status", label: "Status", options: opts("draft", "published", "cancelled") }],
  order: { column: "created_at", ascending: false },
  canCreate: true,
  canDelete: true,
  slugFrom: "title",
  slugRandomSuffix: true,
  publicHref: "/events/{slug}",
  fields: [
    { name: "title", label: "Title", type: "text", required: true, full: true, maxLength: 160 },
    { name: "slug", label: "URL slug", type: "text", hint: "Leave blank to generate from the title." },
    { name: "category_id", label: "Category", type: "select", optionsFrom: { table: "event_categories", label: "name" } },
    { name: "cover_image_url", label: "Cover image", type: "image", folder: "events", full: true },
    { name: "description", label: "Description", type: "textarea", full: true },
    { name: "organizer_name", label: "Organizer display name", type: "text" },
    { name: "owner_email", label: "Organizer account (email)", type: "owner", column: "organizer_id", hint: "Optional. Must be a registered account." },
    { name: "start_date", label: "Start date", type: "date", required: true },
    { name: "end_date", label: "End date", type: "date" },
    { name: "start_time", label: "Start time", type: "time" },
    { name: "end_time", label: "End time", type: "time" },
    { name: "location_name", label: "Location name", type: "text" },
    { name: "location_address", label: "Location address", type: "text" },
    { name: "city", label: "City", type: "text" },
    { name: "currency", label: "Currency", type: "text", required: true, defaultValue: "BDT", maxLength: 8 },
    { name: "starting_price", label: "Starting price", type: "number", min: 0, step: 0.01, defaultValue: 0, hint: "Auto-updated from the ticket types below." },
    { name: "status", label: "Status", type: "select", required: true, options: opts("draft", "published", "cancelled"), defaultValue: "published" },
    { name: "visibility", label: "Visibility", type: "select", required: true, options: VISIBILITY, defaultValue: "public" },
    { name: "is_featured", label: "Feature on homepage", type: "boolean" },
  ],
  children: [ticketTypes, schedules],
};

const categories: Resource = {
  key: "categories",
  table: "event_categories",
  label: "Categories",
  singular: "category",
  description: "Event categories shown on the homepage and in event filters.",
  icon: "Tags",
  titleField: "name",
  list: [
    { name: "name", label: "Name" },
    { name: "slug", label: "Slug", kind: "mono" },
    { name: "icon", label: "Icon" },
    { name: "sort_order", label: "Order" },
  ],
  searchFields: ["name", "slug"],
  order: { column: "sort_order", ascending: true },
  canCreate: true,
  canDelete: true,
  slugFrom: "name",
  slugRandomSuffix: false,
  fields: [
    { name: "name", label: "Name", type: "text", required: true },
    { name: "slug", label: "URL slug", type: "text", hint: "Leave blank to generate from the name." },
    { name: "icon", label: "Icon", type: "select", required: true, options: ICON_OPTIONS, defaultValue: "Sparkles" },
    { name: "sort_order", label: "Sort order", type: "number", step: 1, defaultValue: 0 },
  ],
};

const venues: Resource = {
  key: "venues",
  table: "venues",
  label: "Venues",
  singular: "venue",
  description: "Venues available for booking.",
  icon: "Building2",
  titleField: "name",
  list: [
    { name: "name", label: "Venue" },
    { name: "venue_type", label: "Type", kind: "badge" },
    { name: "city", label: "City" },
    { name: "capacity_max", label: "Capacity" },
    { name: "starting_price", label: "From", kind: "money" },
    { name: "rating_avg", label: "Rating", kind: "stars" },
    { name: "status", label: "Status", kind: "badge" },
    { name: "is_featured", label: "Featured", kind: "bool", toggle: true },
  ],
  searchFields: ["name", "city", "slug"],
  filters: [
    { name: "status", label: "Status", options: PUBLISH_STATUS },
    {
      name: "venue_type",
      label: "Type",
      options: opts("banquet_hall", "hotel", "garden", "rooftop", "restaurant", "community_center", "resort", "other"),
    },
  ],
  order: { column: "created_at", ascending: false },
  canCreate: true,
  canDelete: true,
  slugFrom: "name",
  slugRandomSuffix: true,
  publicHref: "/venues/{slug}",
  fields: [
    { name: "name", label: "Name", type: "text", required: true, full: true },
    { name: "slug", label: "URL slug", type: "text", hint: "Leave blank to generate from the name." },
    {
      name: "venue_type",
      label: "Venue type",
      type: "select",
      required: true,
      options: opts("banquet_hall", "hotel", "garden", "rooftop", "restaurant", "community_center", "resort", "other"),
      defaultValue: "other",
    },
    { name: "cover_image_url", label: "Cover image", type: "image", folder: "venues", full: true },
    { name: "description", label: "Description", type: "textarea", full: true },
    { name: "city", label: "City", type: "text" },
    { name: "address", label: "Address", type: "text" },
    { name: "capacity_min", label: "Min capacity", type: "number", required: true, min: 0, step: 1, defaultValue: 0 },
    { name: "capacity_max", label: "Max capacity", type: "number", required: true, min: 0, step: 1, defaultValue: 0 },
    { name: "starting_price", label: "Starting price", type: "number", required: true, min: 0, step: 0.01, defaultValue: 0 },
    { name: "currency", label: "Currency", type: "text", required: true, defaultValue: "BDT", maxLength: 8 },
    { name: "amenities", label: "Amenities (comma separated)", type: "tags", full: true },
    { name: "rules", label: "Rules", type: "textarea", full: true },
    { name: "owner_email", label: "Owner account (email)", type: "owner", column: "owner_id", hint: "Optional. Gives that user access to manage it." },
    { name: "status", label: "Status", type: "select", required: true, options: PUBLISH_STATUS, defaultValue: "published" },
    { name: "visibility", label: "Visibility", type: "select", required: true, options: VISIBILITY, defaultValue: "public" },
    { name: "is_featured", label: "Feature on homepage", type: "boolean" },
  ],
  children: [venueImages],
};

const vendors: Resource = {
  key: "vendors",
  table: "vendors",
  label: "Vendors",
  singular: "vendor",
  description: "Photographers, caterers, decorators and other service providers.",
  icon: "Store",
  titleField: "business_name",
  list: [
    { name: "business_name", label: "Vendor" },
    { name: "category", label: "Category", kind: "badge" },
    { name: "city", label: "City" },
    { name: "starting_price", label: "From", kind: "money" },
    { name: "rating_avg", label: "Rating", kind: "stars" },
    { name: "status", label: "Status", kind: "badge" },
    { name: "is_featured", label: "Featured", kind: "bool", toggle: true },
  ],
  searchFields: ["business_name", "city", "slug", "contact_email"],
  filters: [
    { name: "status", label: "Status", options: PUBLISH_STATUS },
    {
      name: "category",
      label: "Category",
      options: opts("photography", "videography", "catering", "decoration", "dj_music", "makeup", "security", "transport", "event_planner", "other"),
    },
  ],
  order: { column: "created_at", ascending: false },
  canCreate: true,
  canDelete: true,
  slugFrom: "business_name",
  slugRandomSuffix: true,
  publicHref: "/vendors/{slug}",
  fields: [
    { name: "business_name", label: "Business name", type: "text", required: true, full: true },
    { name: "slug", label: "URL slug", type: "text", hint: "Leave blank to generate from the name." },
    {
      name: "category",
      label: "Category",
      type: "select",
      required: true,
      options: opts("photography", "videography", "catering", "decoration", "dj_music", "makeup", "security", "transport", "event_planner", "other"),
      defaultValue: "other",
    },
    { name: "cover_image_url", label: "Cover image", type: "image", folder: "vendors" },
    { name: "logo_url", label: "Logo", type: "image", folder: "vendors" },
    { name: "description", label: "Description", type: "textarea", full: true },
    { name: "city", label: "City", type: "text" },
    { name: "address", label: "Address", type: "text" },
    { name: "service_area", label: "Service areas (comma separated)", type: "tags", full: true },
    { name: "starting_price", label: "Starting price", type: "number", required: true, min: 0, step: 0.01, defaultValue: 0 },
    { name: "currency", label: "Currency", type: "text", required: true, defaultValue: "BDT", maxLength: 8 },
    { name: "years_experience", label: "Years of experience", type: "number", required: true, min: 0, step: 1, defaultValue: 0 },
    { name: "response_time_hours", label: "Response time (hours)", type: "number", min: 0, step: 1 },
    { name: "contact_email", label: "Contact email", type: "email" },
    { name: "contact_phone", label: "Contact phone", type: "text" },
    { name: "owner_email", label: "Owner account (email)", type: "owner", column: "owner_id", hint: "Optional. Gives that user access to the vendor dashboard." },
    { name: "status", label: "Status", type: "select", required: true, options: PUBLISH_STATUS, defaultValue: "published" },
    { name: "visibility", label: "Visibility", type: "select", required: true, options: VISIBILITY, defaultValue: "public" },
    { name: "is_featured", label: "Feature on homepage", type: "boolean" },
  ],
  children: [vendorServices, vendorPackages, vendorPortfolio],
};

const bookings: Resource = {
  key: "bookings",
  table: "bookings",
  label: "Ticket orders",
  singular: "order",
  description: "Orders placed for event tickets. Open one to confirm, cancel or refund it.",
  icon: "ShoppingBag",
  titleField: "customer_name",
  select: "*, events(title)",
  list: [
    { name: "created_at", label: "Placed", kind: "datetime" },
    { name: "customer_name", label: "Customer" },
    { name: "events.title", label: "Event" },
    { name: "subtotal", label: "Total", kind: "money" },
    { name: "status", label: "Status", kind: "badge" },
  ],
  searchFields: ["customer_name", "customer_email", "customer_phone"],
  filters: [{ name: "status", label: "Status", options: BOOKING_STATUS }],
  order: { column: "created_at", ascending: false },
  canCreate: false,
  canDelete: false,
  detailHref: "/admin/bookings/{id}",
  fields: [],
};

const payments: Resource = {
  key: "payments",
  table: "payments",
  label: "Payments",
  singular: "payment",
  description: "Every payment attempt. Manage the order itself from its order page.",
  icon: "CreditCard",
  titleField: "id",
  select: "*, bookings(customer_name)",
  list: [
    { name: "created_at", label: "Created", kind: "datetime" },
    { name: "bookings.customer_name", label: "Customer" },
    { name: "amount", label: "Amount", kind: "money" },
    { name: "provider", label: "Provider" },
    { name: "provider_reference", label: "Reference", kind: "mono" },
    { name: "status", label: "Status", kind: "badge" },
  ],
  searchFields: ["provider_reference", "provider"],
  filters: [{ name: "status", label: "Status", options: opts("pending", "paid", "failed", "refunded") }],
  order: { column: "created_at", ascending: false },
  canCreate: false,
  canDelete: false,
  detailHref: "/admin/bookings/{booking_id}",
  fields: [],
};

const tickets: Resource = {
  key: "tickets",
  table: "tickets",
  label: "Issued tickets",
  singular: "ticket",
  description: "Individual tickets. Mark them used (check-in) or cancel them.",
  icon: "Ticket",
  titleField: "ticket_code",
  select: "*, events(title)",
  list: [
    { name: "ticket_code", label: "Code", kind: "mono" },
    { name: "holder_name", label: "Holder" },
    { name: "ticket_type_name", label: "Type" },
    { name: "events.title", label: "Event" },
    { name: "status", label: "Status", kind: "badge" },
    { name: "checked_in_at", label: "Checked in", kind: "datetime" },
  ],
  searchFields: ["ticket_code", "holder_name", "holder_email"],
  filters: [{ name: "status", label: "Status", options: opts("valid", "used", "cancelled") }],
  order: { column: "issued_at", ascending: false },
  canCreate: false,
  canDelete: false,
  fields: [
    { name: "ticket_code", label: "Ticket code", type: "readonly" },
    { name: "ticket_type_name", label: "Ticket type", type: "readonly" },
    { name: "holder_name", label: "Holder name", type: "text", required: true },
    { name: "holder_email", label: "Holder email", type: "email", required: true },
    { name: "status", label: "Status", type: "select", required: true, options: opts("valid", "used", "cancelled"), hint: "Marking a ticket used records the check-in time." },
  ],
};

const venueRequests: Resource = {
  key: "venue-requests",
  table: "venue_bookings",
  label: "Venue requests",
  singular: "venue request",
  description: "Booking requests customers sent to venues.",
  icon: "ClipboardList",
  titleField: "event_name",
  select: "*, venues(name)",
  list: [
    { name: "created_at", label: "Received", kind: "datetime" },
    { name: "event_name", label: "Event" },
    { name: "venues.name", label: "Venue" },
    { name: "event_date", label: "Date", kind: "date" },
    { name: "guest_count", label: "Guests" },
    { name: "status", label: "Status", kind: "badge" },
  ],
  searchFields: ["event_name", "notes"],
  filters: [{ name: "status", label: "Status", options: BOOKING_STATUS }],
  order: { column: "created_at", ascending: false },
  canCreate: false,
  canDelete: true,
  fields: [
    { name: "event_name", label: "Event name", type: "readonly" },
    { name: "event_date", label: "Event date", type: "readonly" },
    { name: "event_time", label: "Event time", type: "readonly" },
    { name: "guest_count", label: "Guests", type: "readonly" },
    { name: "notes", label: "Customer notes", type: "readonly", full: true },
    { name: "status", label: "Status", type: "select", required: true, options: BOOKING_STATUS },
  ],
};

const vendorRequests: Resource = {
  key: "vendor-requests",
  table: "vendor_bookings",
  label: "Vendor requests",
  singular: "vendor request",
  description: "Quote / booking requests customers sent to vendors.",
  icon: "ClipboardList",
  titleField: "event_name",
  select: "*, vendors(business_name)",
  list: [
    { name: "created_at", label: "Received", kind: "datetime" },
    { name: "event_name", label: "Event" },
    { name: "vendors.business_name", label: "Vendor" },
    { name: "event_date", label: "Date", kind: "date" },
    { name: "amount", label: "Amount", kind: "money" },
    { name: "status", label: "Status", kind: "badge" },
    { name: "payment_status", label: "Payment", kind: "badge" },
  ],
  searchFields: ["event_name", "service_name", "notes"],
  filters: [{ name: "status", label: "Status", options: BOOKING_STATUS }],
  order: { column: "created_at", ascending: false },
  canCreate: false,
  canDelete: true,
  fields: [
    { name: "event_name", label: "Event name", type: "readonly" },
    { name: "service_name", label: "Service", type: "readonly" },
    { name: "event_date", label: "Event date", type: "readonly" },
    { name: "guest_count", label: "Guests", type: "readonly" },
    { name: "budget", label: "Customer budget", type: "readonly" },
    { name: "notes", label: "Customer notes", type: "readonly", full: true },
    { name: "status", label: "Status", type: "select", required: true, options: BOOKING_STATUS },
    { name: "amount", label: "Agreed amount", type: "number", min: 0, step: 0.01 },
    { name: "payment_status", label: "Payment status", type: "select", required: true, options: opts("pending", "paid", "refunded") },
  ],
};

const testimonials: Resource = {
  key: "testimonials",
  table: "testimonials",
  label: "Testimonials",
  singular: "testimonial",
  description: "Quotes shown in the homepage testimonials section.",
  icon: "Quote",
  titleField: "author_name",
  list: [
    { name: "author_name", label: "Author" },
    { name: "author_role", label: "Role" },
    { name: "quote", label: "Quote" },
    { name: "sort_order", label: "Order" },
    { name: "is_published", label: "Published", kind: "bool", toggle: true },
  ],
  searchFields: ["author_name", "quote"],
  order: { column: "sort_order", ascending: true },
  canCreate: true,
  canDelete: true,
  fields: [
    { name: "quote", label: "Quote", type: "textarea", required: true, full: true },
    { name: "author_name", label: "Author", type: "text", required: true },
    { name: "author_role", label: "Role / location", type: "text" },
    { name: "sort_order", label: "Sort order", type: "number", step: 1, defaultValue: 0 },
    { name: "is_published", label: "Published", type: "boolean", defaultValue: true },
  ],
};

export const RESOURCES: Resource[] = [
  events,
  categories,
  venues,
  vendors,
  bookings,
  payments,
  tickets,
  venueRequests,
  vendorRequests,
  testimonials,
];

export function getResource(key: string): Resource | undefined {
  return RESOURCES.find((r) => r.key === key);
}

export function getChild(resource: Resource, childKey: string): ChildResource | undefined {
  return resource.children?.find((c) => c.key === childKey);
}

/** Fill `{column}` placeholders in an href template from a row. */
export function fillHref(template: string, row: Record<string, unknown>): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => encodeURIComponent(String(row[k] ?? "")));
}

export type { Field };
