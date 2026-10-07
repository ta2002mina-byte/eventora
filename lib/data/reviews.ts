import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { ConversationContextType } from "@/types/messaging";

export type ReviewableType = Extract<ConversationContextType, "vendor" | "venue" | "event">;

const REVIEW_TABLE: Record<ReviewableType, string> = {
  vendor: "vendor_reviews",
  venue: "venue_reviews",
  event: "event_reviews",
};

const ELIGIBILITY_RPC: Record<ReviewableType, string> = {
  vendor: "has_completed_vendor_booking",
  venue: "has_completed_venue_booking",
  event: "has_completed_event_booking",
};

const ELIGIBILITY_ID_PARAM: Record<ReviewableType, string> = {
  vendor: "p_vendor_id",
  venue: "p_venue_id",
  event: "p_event_id",
};

/** Whether the signed-in user has a completed booking against this
 * vendor/venue/event — the precondition for leaving a review. */
export async function canReview(
  type: ReviewableType,
  targetId: string,
  userId: string
): Promise<boolean> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc(ELIGIBILITY_RPC[type], {
    [ELIGIBILITY_ID_PARAM[type]]: targetId,
    p_user_id: userId,
  });
  if (error) {
    console.error(`canReview (${type}):`, error.message);
    return false;
  }
  return !!data;
}

export interface MyReviewItem {
  id: string;
  type: ReviewableType;
  targetId: string;
  targetName: string;
  targetHref: string;
  rating: number;
  title: string | null;
  comment: string | null;
  status: "published" | "hidden";
  created_at: string;
  updated_at: string;
}

/** All reviews the signed-in user has written, across vendors,
 * venues and events — for the "My Reviews" dashboard page. */
export async function getMyReviews(userId: string): Promise<MyReviewItem[]> {
  const supabase = createClient();

  const [vendorRes, venueRes, eventRes] = await Promise.all([
    supabase
      .from("vendor_reviews")
      .select("*, vendors(business_name, slug)")
      .eq("user_id", userId),
    supabase
      .from("venue_reviews")
      .select("*, venues(name, slug)")
      .eq("user_id", userId),
    supabase
      .from("event_reviews")
      .select("*, events(title, slug)")
      .eq("user_id", userId),
  ]);

  const items: MyReviewItem[] = [];

  for (const row of vendorRes.data ?? []) {
    items.push({
      id: row.id,
      type: "vendor",
      targetId: row.vendor_id,
      targetName: row.vendors?.business_name ?? "Vendor",
      targetHref: row.vendors?.slug ? `/vendors/${row.vendors.slug}` : "/vendors",
      rating: row.rating,
      title: row.title,
      comment: row.comment,
      status: row.status ?? "published",
      created_at: row.created_at,
      updated_at: row.updated_at ?? row.created_at,
    });
  }
  for (const row of venueRes.data ?? []) {
    items.push({
      id: row.id,
      type: "venue",
      targetId: row.venue_id,
      targetName: row.venues?.name ?? "Venue",
      targetHref: row.venues?.slug ? `/venues/${row.venues.slug}` : "/venues",
      rating: row.rating,
      title: row.title,
      comment: row.comment,
      status: row.status ?? "published",
      created_at: row.created_at,
      updated_at: row.updated_at ?? row.created_at,
    });
  }
  for (const row of eventRes.data ?? []) {
    items.push({
      id: row.id,
      type: "event",
      targetId: row.event_id,
      targetName: row.events?.title ?? "Event",
      targetHref: row.events?.slug ? `/events/${row.events.slug}` : "/events",
      rating: row.rating,
      title: row.title,
      comment: row.comment,
      status: row.status ?? "published",
      created_at: row.created_at,
      updated_at: row.updated_at ?? row.created_at,
    });
  }

  return items.sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export { REVIEW_TABLE };
