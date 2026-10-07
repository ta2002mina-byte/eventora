import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { EventCategory, EventRecord } from "@/types/event";
import type { VenueRecord } from "@/types/venue";
import type { VendorRecord } from "@/types/vendor";

/* Homepage data. "Featured" is controlled from /admin (is_featured flag).
 * If nothing is flagged yet we show the newest published items instead so
 * the homepage never looks empty on a fresh install. */

async function featured<T>(table: string, select: string, extra?: (q: any) => any): Promise<T[]> { // eslint-disable-line @typescript-eslint/no-explicit-any
  const supabase = createClient();
  const base = () => {
    let q = supabase.from(table).select(select).eq("status", "published").eq("visibility", "public");
    if (extra) q = extra(q);
    return q;
  };
  const flagged = await base().eq("is_featured", true).order("created_at", { ascending: false }).limit(3);
  if (!flagged.error && flagged.data && flagged.data.length > 0) return flagged.data as unknown as T[];
  const latest = await base().order("created_at", { ascending: false }).limit(3);
  if (latest.error) {
    console.error(`featured(${table}):`, latest.error.message);
    return [];
  }
  return (latest.data ?? []) as unknown as T[];
}

export const getFeaturedEvents = () =>
  featured<EventRecord>("events", "*, event_categories(*), event_ticket_types(quantity_total, quantity_sold)", (q) =>
    q.gte("start_date", new Date().toISOString().slice(0, 10))
  );
export const getFeaturedVenues = () => featured<VenueRecord>("venues", "*");
export const getFeaturedVendors = () => featured<VendorRecord>("vendors", "*");

export async function getHomeCategories(): Promise<EventCategory[]> {
  const { data, error } = await createClient().from("event_categories").select("*").order("sort_order", { ascending: true });
  if (error) return [];
  return (data ?? []) as EventCategory[];
}

export interface Testimonial { id: string; quote: string; author_name: string; author_role: string | null }

export async function getTestimonials(): Promise<Testimonial[]> {
  const { data, error } = await createClient()
    .from("testimonials")
    .select("id, quote, author_name, author_role")
    .eq("is_published", true)
    .order("sort_order", { ascending: true });
  if (error) return [];
  return (data ?? []) as Testimonial[];
}
