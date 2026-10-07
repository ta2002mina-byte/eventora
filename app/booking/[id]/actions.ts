"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { getEventBySlugOrId } from "@/lib/data/events";
import { ticketAvailability } from "@/types/event";

const itemSchema = z.object({
  ticketTypeId: z.string().uuid().nullable(),
  quantity: z.coerce.number().int().min(0).max(20),
});

const createBookingSchema = z.object({
  eventId: z.string().uuid(),
  items: z.array(itemSchema).min(1),
  customerName: z.string().trim().min(2, "Enter the ticket holder's name").max(120),
  customerEmail: z.string().trim().email("Enter a valid email"),
  customerPhone: z.string().trim().max(30).optional().or(z.literal("")),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;

export interface CreateBookingResult {
  ok: boolean;
  error?: string;
  bookingId?: string;
}

/**
 * Creates a pending booking (order) for one or more ticket types on an
 * event. Prices and availability are always re-read from the database
 * here — the client only sends ticket type ids + quantities, never a
 * price, so a tampered request can't buy a discounted ticket.
 */
export async function createBooking(input: CreateBookingInput): Promise<CreateBookingResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Sign in to get tickets." };

  const parsed = createBookingSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid booking." };
  }
  const values = parsed.data;

  const event = await getEventBySlugOrId(values.eventId);
  if (!event) return { ok: false, error: "Event not found." };
  if (event.status !== "published") return { ok: false, error: "This event isn't available." };

  const requestedItems = values.items.filter((i) => i.quantity > 0);
  if (requestedItems.length === 0) {
    return { ok: false, error: "Select at least one ticket." };
  }

  type Line = { ticket_type_id: string | null; name: string; unit_price: number; quantity: number; subtotal: number };
  const lines: Line[] = [];

  if (event.event_ticket_types.length === 0) {
    // No configured ticket tiers — a single General Admission line at
    // the event's starting price.
    const only = requestedItems[0];
    lines.push({
      ticket_type_id: null,
      name: "General Admission",
      unit_price: event.starting_price,
      quantity: only.quantity,
      subtotal: event.starting_price * only.quantity,
    });
  } else {
    for (const item of requestedItems) {
      const ticketType = event.event_ticket_types.find((t) => t.id === item.ticketTypeId);
      if (!ticketType) continue;
      const remaining = ticketAvailability(ticketType);
      if (item.quantity > remaining) {
        return { ok: false, error: `Only ${remaining} left for "${ticketType.name}".` };
      }
      lines.push({
        ticket_type_id: ticketType.id,
        name: ticketType.name,
        unit_price: ticketType.price,
        quantity: item.quantity,
        subtotal: ticketType.price * item.quantity,
      });
    }
  }

  if (lines.length === 0) {
    return { ok: false, error: "Select at least one ticket." };
  }

  const subtotal = lines.reduce((sum, l) => sum + l.subtotal, 0);
  const supabase = createClient();

  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .insert({
      user_id: user.id,
      event_id: event.id,
      status: "pending",
      customer_name: values.customerName,
      customer_email: values.customerEmail,
      customer_phone: values.customerPhone || null,
      notes: values.notes || null,
      subtotal,
      currency: event.currency,
    })
    .select("id")
    .single();

  if (bookingError || !booking) {
    return { ok: false, error: bookingError?.message ?? "Couldn't start checkout." };
  }

  const { error: itemsError } = await supabase.from("ticket_items").insert(
    lines.map((l) => ({
      booking_id: booking.id,
      ticket_type_id: l.ticket_type_id,
      name: l.name,
      unit_price: l.unit_price,
      quantity: l.quantity,
      subtotal: l.subtotal,
    }))
  );

  if (itemsError) {
    // Best-effort cleanup so a failed order doesn't linger as an empty booking.
    await supabase.from("bookings").delete().eq("id", booking.id);
    return { ok: false, error: itemsError.message };
  }

  return { ok: true, bookingId: booking.id as string };
}
