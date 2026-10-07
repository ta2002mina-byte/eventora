import "server-only";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";
import type { TicketItemRecord } from "@/types/booking";

function generateTicketCode() {
  return `EVT-${randomBytes(5).toString("hex").toUpperCase()}`;
}

export interface BookingForFinalization {
  id: string;
  event_id: string;
  user_id: string;
  customer_name: string;
  customer_email: string;
  ticket_items: TicketItemRecord[];
}

/**
 * Marks a payment paid, confirms its booking, and issues the
 * holder-facing tickets. Shared by:
 * - the synchronous dev/test payment flow (checkout/[id]/actions.ts)
 * - the SSLCommerz IPN + success-redirect callbacks
 *   (app/api/payments/sslcommerz/*), which call this once the
 *   transaction has been server-side validated.
 */
export async function finalizeBookingPayment(
  booking: BookingForFinalization,
  paymentId: string,
  providerReference: string | null
) {
  const admin = createAdminClient();

  await admin
    .from("payments")
    .update({
      status: "paid",
      provider_reference: providerReference,
      paid_at: new Date().toISOString(),
    })
    .eq("id", paymentId);

  await admin
    .from("bookings")
    .update({ status: "confirmed", updated_at: new Date().toISOString() })
    .eq("id", booking.id);

  const ticketRows = booking.ticket_items.flatMap((item) =>
    Array.from({ length: item.quantity }, () => ({
      booking_id: booking.id,
      ticket_item_id: item.id,
      event_id: booking.event_id,
      user_id: booking.user_id,
      ticket_code: generateTicketCode(),
      ticket_type_name: item.name,
      holder_name: booking.customer_name,
      holder_email: booking.customer_email,
    }))
  );

  if (ticketRows.length) {
    const { error: ticketsError } = await admin.from("tickets").insert(ticketRows);
    if (ticketsError) {
      // Payment already succeeded — surface nothing scary to the buyer;
      // in a real system this would trigger manual reconciliation.
      console.error("finalizeBookingPayment (issue tickets):", ticketsError.message);
    }
  }

  revalidatePath("/tickets");
  revalidatePath(`/checkout/${booking.id}`);
  revalidatePath("/dashboard/bookings");
}

/** Reverses a reserved-inventory hold when a payment fails/expires. */
export async function releaseTicketReservations(
  reserved: { ticketTypeId: string; quantity: number }[]
) {
  const admin = createAdminClient();
  for (const r of reserved) {
    const { data: current } = await admin
      .from("event_ticket_types")
      .select("quantity_sold")
      .eq("id", r.ticketTypeId)
      .single();
    if (current) {
      await admin
        .from("event_ticket_types")
        .update({ quantity_sold: Math.max(0, current.quantity_sold - r.quantity) })
        .eq("id", r.ticketTypeId);
    }
  }
}

/**
 * Loads a payment row plus its booking (with ticket_items) using the
 * admin client — for use in payment-gateway callback routes, which
 * run with no signed-in user session.
 */
export async function loadPaymentForCallback(paymentId: string) {
  const admin = createAdminClient();
  const { data: payment } = await admin
    .from("payments")
    .select("id, booking_id, status")
    .eq("id", paymentId)
    .maybeSingle();
  if (!payment) return { payment: null, booking: null };

  const { data: booking } = await admin
    .from("bookings")
    .select("*, ticket_items(*)")
    .eq("id", payment.booking_id)
    .maybeSingle();

  return { payment, booking: booking as unknown as BookingForFinalization | null };
}

/** Releases inventory for every ticket_item on a booking (mirrors how it was reserved). */
export async function releaseReservationsForBooking(booking: BookingForFinalization) {
  const reserved = booking.ticket_items
    .filter((item) => item.ticket_type_id)
    .map((item) => ({ ticketTypeId: item.ticket_type_id as string, quantity: item.quantity }));
  await releaseTicketReservations(reserved);
}

/** Marks a payment failed (gateway declined, cancelled, or expired) and releases its hold. */
export async function markPaymentFailed(paymentId: string, booking: BookingForFinalization) {
  const admin = createAdminClient();
  await admin.from("payments").update({ status: "failed" }).eq("id", paymentId);
  await releaseReservationsForBooking(booking);
  revalidatePath(`/checkout/${booking.id}`);
}
