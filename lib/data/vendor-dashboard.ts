import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type {
  VendorBookingRecord,
  VendorPackage,
  VendorService,
  VendorReview,
  VendorWithDetails,
} from "@/types/vendor";
import type { Profile } from "@/types/profile";

/**
 * Fetches the vendor profile owned by the signed-in user, with all
 * related rows. RLS already scopes every table here to `owner_id =
 * auth.uid()`, so this can only ever return the caller's own vendor —
 * this function additionally filters by owner_id for clarity and to
 * avoid an ambiguous `.single()` if RLS were ever loosened.
 */
export const getVendorForOwner = cache(async (userId: string): Promise<VendorWithDetails | null> => {
  const supabase = createClient();
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
    .eq("owner_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("getVendorForOwner:", error.message);
    return null;
  }
  if (!data) return null;

  return {
    ...(data as unknown as VendorWithDetails),
    vendor_services: [...(data.vendor_services ?? [])].sort(
      (a: VendorService, b: VendorService) => a.name.localeCompare(b.name)
    ),
    vendor_packages: [...(data.vendor_packages ?? [])].sort(
      (a: VendorPackage, b: VendorPackage) => a.price - b.price
    ),
    vendor_portfolio: [...(data.vendor_portfolio ?? [])].sort(
      (a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order
    ),
    vendor_availability: [...(data.vendor_availability ?? [])].sort(
      (a: { date: string }, b: { date: string }) => a.date.localeCompare(b.date)
    ),
    vendor_reviews: [...(data.vendor_reviews ?? [])].sort(
      (a: VendorReview, b: VendorReview) => b.created_at.localeCompare(a.created_at)
    ),
  };
});

async function getProfilesByIds(userIds: string[]): Promise<Map<string, Profile>> {
  const map = new Map<string, Profile>();
  if (userIds.length === 0) return map;

  const supabase = createClient();
  const { data, error } = await supabase.from("profiles").select("*").in("id", userIds);
  if (error) {
    console.error("getProfilesByIds:", error.message);
    return map;
  }
  for (const row of (data ?? []) as Profile[]) map.set(row.id, row);
  return map;
}

export interface VendorBookingWithCustomer extends VendorBookingRecord {
  customer: Profile | null;
}

export async function getVendorBookings(
  vendorId: string,
  status?: VendorBookingRecord["status"]
): Promise<VendorBookingWithCustomer[]> {
  const supabase = createClient();
  let query = supabase
    .from("vendor_bookings")
    .select("*")
    .eq("vendor_id", vendorId)
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) {
    console.error("getVendorBookings:", error.message);
    return [];
  }

  const bookings = (data ?? []) as VendorBookingRecord[];
  const profiles = await getProfilesByIds([...new Set(bookings.map((b) => b.user_id))]);

  return bookings.map((b) => ({ ...b, customer: profiles.get(b.user_id) ?? null }));
}

export interface VendorDashboardOverview {
  bookingStats: {
    total: number;
    pending: number;
    confirmed: number;
    completed: number;
    cancelled: number;
  };
  upcomingBookings: VendorBookingWithCustomer[];
  pendingQuotes: VendorBookingWithCustomer[];
  earnings: { total: number; pending: number; completed: number };
  reviewStats: { average: number; count: number };
  recentActivity: { id: string; label: string; date: string; href: string }[];
}

export async function getVendorDashboardOverview(vendor: VendorWithDetails): Promise<VendorDashboardOverview> {
  const bookings = await getVendorBookings(vendor.id);

  const today = new Date().toISOString().slice(0, 10);
  const bookingStats = {
    total: bookings.length,
    pending: bookings.filter((b) => b.status === "pending").length,
    confirmed: bookings.filter((b) => b.status === "confirmed").length,
    completed: bookings.filter((b) => b.status === "completed").length,
    cancelled: bookings.filter((b) => b.status === "cancelled").length,
  };

  const upcomingBookings = bookings
    .filter((b) => (b.status === "confirmed" || b.status === "pending") && b.event_date >= today)
    .sort((a, b) => a.event_date.localeCompare(b.event_date))
    .slice(0, 5);

  const pendingQuotes = bookings
    .filter((b) => b.status === "pending")
    .slice(0, 5);

  const earningsSource = bookings.filter((b) => b.status === "confirmed" || b.status === "completed");
  const earnings = {
    total: earningsSource.reduce((sum, b) => sum + (b.amount ?? b.budget ?? 0), 0),
    pending: bookings
      .filter((b) => b.status === "confirmed" && b.payment_status !== "paid")
      .reduce((sum, b) => sum + (b.amount ?? b.budget ?? 0), 0),
    completed: bookings
      .filter((b) => b.status === "completed" || b.payment_status === "paid")
      .reduce((sum, b) => sum + (b.amount ?? b.budget ?? 0), 0),
  };

  const reviewStats = {
    average: vendor.rating_avg,
    count: vendor.rating_count,
  };

  const recentActivity = [
    ...bookings.slice(0, 5).map((b) => ({
      id: `booking-${b.id}`,
      label: `${b.event_name} — quote ${b.status}`,
      date: b.created_at,
      href: "/vendor/dashboard/bookings",
    })),
    ...vendor.vendor_reviews.slice(0, 3).map((r) => ({
      id: `review-${r.id}`,
      label: `New ${r.rating}-star review${r.title ? `: ${r.title}` : ""}`,
      date: r.created_at,
      href: "/vendor/dashboard/reviews",
    })),
  ]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 6);

  return { bookingStats, upcomingBookings, pendingQuotes, earnings, reviewStats, recentActivity };
}

export interface VendorCustomer {
  profile: Profile | null;
  userId: string;
  bookingCount: number;
  totalSpent: number;
  lastBookingDate: string;
  statuses: VendorBookingRecord["status"][];
}

export async function getVendorCustomers(vendorId: string): Promise<VendorCustomer[]> {
  const bookings = await getVendorBookings(vendorId);
  const byCustomer = new Map<string, VendorCustomer>();

  for (const b of bookings) {
    const existing = byCustomer.get(b.user_id);
    const spent = b.status === "completed" || b.status === "confirmed" ? b.amount ?? b.budget ?? 0 : 0;
    if (existing) {
      existing.bookingCount += 1;
      existing.totalSpent += spent;
      existing.statuses.push(b.status);
      if (b.created_at > existing.lastBookingDate) existing.lastBookingDate = b.created_at;
    } else {
      byCustomer.set(b.user_id, {
        profile: b.customer,
        userId: b.user_id,
        bookingCount: 1,
        totalSpent: spent,
        lastBookingDate: b.created_at,
        statuses: [b.status],
      });
    }
  }

  return [...byCustomer.values()].sort((a, b) => b.lastBookingDate.localeCompare(a.lastBookingDate));
}

export interface VendorEarnings {
  total: number;
  pending: number;
  completed: number;
  transactions: VendorBookingWithCustomer[];
}

export async function getVendorEarnings(vendorId: string): Promise<VendorEarnings> {
  const bookings = await getVendorBookings(vendorId);
  const transactions = bookings.filter((b) => b.status === "confirmed" || b.status === "completed");

  return {
    total: transactions.reduce((sum, b) => sum + (b.amount ?? b.budget ?? 0), 0),
    pending: transactions
      .filter((b) => b.payment_status !== "paid")
      .reduce((sum, b) => sum + (b.amount ?? b.budget ?? 0), 0),
    completed: transactions
      .filter((b) => b.payment_status === "paid")
      .reduce((sum, b) => sum + (b.amount ?? b.budget ?? 0), 0),
    transactions: transactions.sort((a, b) => b.created_at.localeCompare(a.created_at)),
  };
}

export interface VendorReviewWithCustomer extends VendorReview {
  customer: Profile | null;
}

export interface VendorReviewStats {
  average: number;
  count: number;
  breakdown: Record<1 | 2 | 3 | 4 | 5, number>;
  reviews: VendorReviewWithCustomer[];
}

export async function getVendorReviewStats(vendor: VendorWithDetails): Promise<VendorReviewStats> {
  const profiles = await getProfilesByIds([...new Set(vendor.vendor_reviews.map((r) => r.user_id))]);
  const breakdown: Record<1 | 2 | 3 | 4 | 5, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const r of vendor.vendor_reviews) {
    const rating = Math.min(5, Math.max(1, Math.round(r.rating))) as 1 | 2 | 3 | 4 | 5;
    breakdown[rating] += 1;
  }

  return {
    average: vendor.rating_avg,
    count: vendor.rating_count,
    breakdown,
    reviews: vendor.vendor_reviews.map((r) => ({ ...r, customer: profiles.get(r.user_id) ?? null })),
  };
}
