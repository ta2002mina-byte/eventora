import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { EventRecord } from "@/types/event";
import type { GuestRecord, RsvpStatus } from "@/types/guest";
import { getGuestSummary, type GuestSummary } from "@/types/guest";
import type { BudgetExpenseRecord } from "@/types/budget";
import { getBudgetTotals, type BudgetTotals } from "@/types/budget";
import { getUserEvents } from "@/lib/data/planner";

// ---------------------------------------------------------------
// Bookings (venue + vendor requests placed by the customer)
// ---------------------------------------------------------------

export type BookingKind = "venue" | "vendor";

export interface DashboardBooking {
  id: string;
  kind: BookingKind;
  targetName: string;
  targetHref: string;
  eventName: string;
  eventDate: string;
  status: string;
  amount: number | null;
  createdAt: string;
}

export async function getUserBookings(userId: string): Promise<DashboardBooking[]> {
  const supabase = createClient();

  const [venueRes, vendorRes] = await Promise.all([
    supabase
      .from("venue_bookings")
      .select("id, event_name, event_date, status, created_at, venues ( name, slug )")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    supabase
      .from("vendor_bookings")
      .select("id, event_name, event_date, status, budget, created_at, vendors ( business_name, slug )")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
  ]);

  if (venueRes.error) console.error("getUserBookings (venue):", venueRes.error.message);
  if (vendorRes.error) console.error("getUserBookings (vendor):", vendorRes.error.message);

  const venueRows = (venueRes.data ?? []) as unknown as {
    id: string;
    event_name: string;
    event_date: string;
    status: string;
    created_at: string;
    venues: { name: string; slug: string } | null;
  }[];

  const vendorRows = (vendorRes.data ?? []) as unknown as {
    id: string;
    event_name: string;
    event_date: string;
    status: string;
    budget: number | null;
    created_at: string;
    vendors: { business_name: string; slug: string } | null;
  }[];

  const venueBookings: DashboardBooking[] = venueRows.map((r) => ({
    id: r.id,
    kind: "venue",
    targetName: r.venues?.name ?? "Venue",
    targetHref: r.venues?.slug ? `/venues/${r.venues.slug}` : "/venues",
    eventName: r.event_name,
    eventDate: r.event_date,
    status: r.status,
    amount: null,
    createdAt: r.created_at,
  }));

  const vendorBookings: DashboardBooking[] = vendorRows.map((r) => ({
    id: r.id,
    kind: "vendor",
    targetName: r.vendors?.business_name ?? "Vendor",
    targetHref: r.vendors?.slug ? `/vendors/${r.vendors.slug}` : "/vendors",
    eventName: r.event_name,
    eventDate: r.event_date,
    status: r.status,
    amount: r.budget,
    createdAt: r.created_at,
  }));

  return [...venueBookings, ...vendorBookings].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  );
}

// ---------------------------------------------------------------
// Guests, aggregated across all of the user's events
// ---------------------------------------------------------------

export interface EventGuestGroup {
  event: Pick<EventRecord, "id" | "title" | "start_date">;
  guests: GuestRecord[];
  summary: GuestSummary;
}

export async function getGuestsByEvent(events: EventRecord[]): Promise<EventGuestGroup[]> {
  if (events.length === 0) return [];
  const supabase = createClient();
  const ids = events.map((e) => e.id);

  const { data, error } = await supabase
    .from("guests")
    .select("*")
    .in("event_id", ids)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getGuestsByEvent:", error.message);
    return [];
  }

  const guests = (data as GuestRecord[]) ?? [];
  return events
    .map((event) => {
      const eventGuests = guests.filter((g) => g.event_id === event.id);
      return {
        event: { id: event.id, title: event.title, start_date: event.start_date },
        guests: eventGuests,
        summary: getGuestSummary(eventGuests),
      };
    })
    .filter((group) => group.guests.length > 0);
}

export function aggregateRsvp(groups: EventGuestGroup[]): GuestSummary {
  return groups.reduce<GuestSummary>(
    (acc, g) => ({
      total: acc.total + g.summary.total,
      headcount: acc.headcount + g.summary.headcount,
      pending: acc.pending + g.summary.pending,
      invited: acc.invited + g.summary.invited,
      confirmed: acc.confirmed + g.summary.confirmed,
      declined: acc.declined + g.summary.declined,
    }),
    { total: 0, headcount: 0, pending: 0, invited: 0, confirmed: 0, declined: 0 }
  );
}

// ---------------------------------------------------------------
// Budgets, aggregated across all of the user's events
// ---------------------------------------------------------------

export interface EventBudgetGroup {
  event: Pick<EventRecord, "id" | "title" | "start_date" | "currency">;
  totals: BudgetTotals;
}

export async function getBudgetsByEvent(events: EventRecord[]): Promise<EventBudgetGroup[]> {
  if (events.length === 0) return [];
  const supabase = createClient();
  const ids = events.map((e) => e.id);

  const [budgetRes, expenseRes] = await Promise.all([
    supabase.from("event_budget").select("event_id, total_amount").in("event_id", ids),
    supabase.from("budget_expenses").select("*").in("event_id", ids),
  ]);

  if (budgetRes.error) console.error("getBudgetsByEvent (budget):", budgetRes.error.message);
  if (expenseRes.error) console.error("getBudgetsByEvent (expenses):", expenseRes.error.message);

  const budgetTotals = new Map<string, number>();
  for (const row of (budgetRes.data ?? []) as { event_id: string; total_amount: number }[]) {
    budgetTotals.set(row.event_id, row.total_amount);
  }
  const expenses = (expenseRes.data as BudgetExpenseRecord[]) ?? [];

  return events
    .map((event) => {
      const eventExpenses = expenses.filter((e) => e.event_id === event.id);
      const total = budgetTotals.get(event.id) ?? event.budget ?? 0;
      return {
        event: {
          id: event.id,
          title: event.title,
          start_date: event.start_date,
          currency: event.currency,
        },
        totals: getBudgetTotals(total, eventExpenses),
      };
    })
    .filter((group) => group.totals.totalBudget > 0 || group.totals.actual > 0);
}

export function aggregateBudget(groups: EventBudgetGroup[]): BudgetTotals {
  return groups.reduce<BudgetTotals>(
    (acc, g) => ({
      totalBudget: acc.totalBudget + g.totals.totalBudget,
      planned: acc.planned + g.totals.planned,
      actual: acc.actual + g.totals.actual,
      remaining: acc.remaining + g.totals.remaining,
      paidCount: acc.paidCount + g.totals.paidCount,
      unpaidCount: acc.unpaidCount + g.totals.unpaidCount,
    }),
    { totalBudget: 0, planned: 0, actual: 0, remaining: 0, paidCount: 0, unpaidCount: 0 }
  );
}

// ---------------------------------------------------------------
// Saved items (favorited events / venues / vendors)
// ---------------------------------------------------------------

export interface SavedItem {
  id: string;
  kind: "event" | "venue" | "vendor";
  title: string;
  subtitle: string | null;
  imageUrl: string | null;
  href: string;
}

export async function getSavedItems(userId: string): Promise<SavedItem[]> {
  const supabase = createClient();

  const [eventRes, venueRes, vendorRes] = await Promise.all([
    supabase
      .from("favorites")
      .select("created_at, events ( id, title, slug, city, cover_image_url )")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    supabase
      .from("venue_favorites")
      .select("created_at, venues ( id, name, slug, city, cover_image_url )")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    supabase
      .from("vendor_favorites")
      .select("created_at, vendors ( id, business_name, slug, category, cover_image_url )")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
  ]);

  if (eventRes.error) console.error("getSavedItems (events):", eventRes.error.message);
  if (venueRes.error) console.error("getSavedItems (venues):", venueRes.error.message);
  if (vendorRes.error) console.error("getSavedItems (vendors):", vendorRes.error.message);

  const items: SavedItem[] = [];

  for (const row of (eventRes.data ?? []) as unknown as {
    events: { id: string; title: string; slug: string; city: string | null; cover_image_url: string | null } | null;
  }[]) {
    if (!row.events) continue;
    items.push({
      id: row.events.id,
      kind: "event",
      title: row.events.title,
      subtitle: row.events.city,
      imageUrl: row.events.cover_image_url,
      href: `/events/${row.events.slug}`,
    });
  }

  for (const row of (venueRes.data ?? []) as unknown as {
    venues: { id: string; name: string; slug: string; city: string | null; cover_image_url: string | null } | null;
  }[]) {
    if (!row.venues) continue;
    items.push({
      id: row.venues.id,
      kind: "venue",
      title: row.venues.name,
      subtitle: row.venues.city,
      imageUrl: row.venues.cover_image_url,
      href: `/venues/${row.venues.slug}`,
    });
  }

  for (const row of (vendorRes.data ?? []) as unknown as {
    vendors: { id: string; business_name: string; slug: string; category: string; cover_image_url: string | null } | null;
  }[]) {
    if (!row.vendors) continue;
    items.push({
      id: row.vendors.id,
      kind: "vendor",
      title: row.vendors.business_name,
      subtitle: row.vendors.category,
      imageUrl: row.vendors.cover_image_url,
      href: `/vendors/${row.vendors.slug}`,
    });
  }

  return items;
}

// ---------------------------------------------------------------
// Overview composition
// ---------------------------------------------------------------

export interface ActivityItem {
  id: string;
  label: string;
  date: string;
  href: string;
}

export interface DashboardOverview {
  events: EventRecord[];
  upcoming: EventRecord[];
  taskStats: { total: number; complete: number };
  rsvp: GuestSummary;
  budget: BudgetTotals;
  bookings: { total: number; pending: number; confirmed: number };
  recentBookings: DashboardBooking[];
  savedCount: number;
  savedPreview: SavedItem[];
  activity: ActivityItem[];
}

export async function getDashboardOverview(userId: string): Promise<DashboardOverview> {
  const events = await getUserEvents(userId);
  const eventIds = events.map((e) => e.id);
  const supabase = createClient();

  const [taskRes, guestGroups, budgetGroups, bookings, saved] = await Promise.all([
    eventIds.length
      ? supabase.from("event_tasks").select("is_complete").in("event_id", eventIds)
      : Promise.resolve({ data: [] as { is_complete: boolean }[], error: null }),
    getGuestsByEvent(events),
    getBudgetsByEvent(events),
    getUserBookings(userId),
    getSavedItems(userId),
  ]);

  if ("error" in taskRes && taskRes.error) {
    console.error("getDashboardOverview (tasks):", taskRes.error.message);
  }
  const tasks = (taskRes.data as { is_complete: boolean }[]) ?? [];

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = events
    .filter((e) => e.start_date >= today)
    .sort((a, b) => a.start_date.localeCompare(b.start_date))
    .slice(0, 4);

  const bookingSummary = {
    total: bookings.length,
    pending: bookings.filter((b) => b.status === "pending").length,
    confirmed: bookings.filter((b) => b.status === "confirmed").length,
  };

  const activity: ActivityItem[] = [
    ...bookings.slice(0, 4).map((b) => ({
      id: `booking-${b.id}`,
      label: `${b.kind === "venue" ? "Venue" : "Vendor"} request to ${b.targetName} for ${b.eventName}`,
      date: b.createdAt,
      href: "/dashboard/bookings",
    })),
    ...events.slice(0, 4).map((e) => ({
      id: `event-${e.id}`,
      label: `Created event "${e.title}"`,
      date: e.created_at,
      href: `/dashboard/events/${e.id}`,
    })),
  ]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 6);

  return {
    events,
    upcoming,
    taskStats: {
      total: tasks.length,
      complete: tasks.filter((t) => t.is_complete).length,
    },
    rsvp: aggregateRsvp(guestGroups),
    budget: aggregateBudget(budgetGroups),
    bookings: bookingSummary,
    recentBookings: bookings.slice(0, 3),
    savedCount: saved.length,
    savedPreview: saved.slice(0, 3),
    activity,
  };
}

export const RSVP_BADGE_VARIANT: Record<RsvpStatus, "gray" | "warning" | "success" | "danger"> = {
  pending: "gray",
  invited: "warning",
  confirmed: "success",
  declined: "danger",
};
