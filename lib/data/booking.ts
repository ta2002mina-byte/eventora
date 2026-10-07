import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { BookingWithItems, PaymentRecord, TicketWithEvent } from "@/types/booking";

/** A single booking, scoped to its owner, with its ticket line items
 * and minimal event info for display (title/date/link). */
export async function getUserBookingById(
  bookingId: string,
  userId: string
): Promise<(BookingWithItems & { event: { id: string; title: string; slug: string; start_date: string } | null }) | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("*, ticket_items(*), event:events(id, title, slug, start_date)")
    .eq("id", bookingId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("getUserBookingById:", error.message);
    return null;
  }
  if (!data) return null;
  return data as unknown as BookingWithItems & {
    event: { id: string; title: string; slug: string; start_date: string } | null;
  };
}

export async function getLatestPaymentForBooking(bookingId: string): Promise<PaymentRecord | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("booking_id", bookingId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("getLatestPaymentForBooking:", error.message);
    return null;
  }
  return (data as PaymentRecord) ?? null;
}

/** All of the current user's issued tickets, newest event first. */
export async function getUserTickets(userId: string): Promise<TicketWithEvent[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("tickets")
    .select(
      "*, event:events(id, title, slug, start_date, start_time, location_name, city, cover_image_url)"
    )
    .eq("user_id", userId)
    .order("issued_at", { ascending: false });

  if (error) {
    console.error("getUserTickets:", error.message);
    return [];
  }
  return (data as unknown as TicketWithEvent[]) ?? [];
}

export async function getUserTicketById(
  ticketId: string,
  userId: string
): Promise<TicketWithEvent | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("tickets")
    .select(
      "*, event:events(id, title, slug, start_date, start_time, location_name, city, cover_image_url)"
    )
    .eq("id", ticketId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("getUserTicketById:", error.message);
    return null;
  }
  return (data as unknown as TicketWithEvent) ?? null;
}

export async function getTicketsForBooking(bookingId: string, userId: string): Promise<TicketWithEvent[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("tickets")
    .select(
      "*, event:events(id, title, slug, start_date, start_time, location_name, city, cover_image_url)"
    )
    .eq("booking_id", bookingId)
    .eq("user_id", userId)
    .order("issued_at", { ascending: true });

  if (error) {
    console.error("getTicketsForBooking:", error.message);
    return [];
  }
  return (data as unknown as TicketWithEvent[]) ?? [];
}
