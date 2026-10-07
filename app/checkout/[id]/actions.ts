"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { getPaymentProvider } from "@/services/payments";
import { createSslcommerzSession, isSslcommerzConfigured } from "@/services/payments/providers/sslcommerz";
import {
  finalizeBookingPayment,
  releaseTicketReservations,
  type BookingForFinalization,
} from "@/lib/payments/finalize-booking";
import type { TicketItemRecord } from "@/types/booking";

interface ActionResult {
  ok: boolean;
  error?: string;
}

export interface OwnedBooking extends BookingForFinalization {
  status: string;
  subtotal: number;
  currency: string;
}

async function loadOwnedBooking(bookingId: string, userId: string) {
  const supabase = createClient();
  const { data: booking, error } = await supabase
    .from("bookings")
    .select("*, ticket_items(*)")
    .eq("id", bookingId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !booking) return { booking: null, error: error?.message ?? "Booking not found." };
  return { booking: booking as unknown as OwnedBooking, error: null };
}

async function reserveTicketInventory(
  booking: OwnedBooking
): Promise<{ ok: boolean; reserved: { ticketTypeId: string; quantity: number }[]; error?: string }> {
  const admin = createAdminClient();
  const reserved: { ticketTypeId: string; quantity: number }[] = [];

  for (const item of booking.ticket_items as TicketItemRecord[]) {
    if (!item.ticket_type_id) continue; // General Admission with no configured tier

    const { data: current, error: readError } = await admin
      .from("event_ticket_types")
      .select("quantity_total, quantity_sold")
      .eq("id", item.ticket_type_id)
      .single();

    if (readError || !current) {
      await releaseTicketReservations(reserved);
      return { ok: false, reserved: [], error: "One of the selected ticket types no longer exists." };
    }

    const nextSold = current.quantity_sold + item.quantity;
    if (nextSold > current.quantity_total) {
      await releaseTicketReservations(reserved);
      return { ok: false, reserved: [], error: `"${item.name}" sold out while you were checking out.` };
    }

    const { error: writeError } = await admin
      .from("event_ticket_types")
      .update({ quantity_sold: nextSold })
      .eq("id", item.ticket_type_id)
      .eq("quantity_sold", current.quantity_sold);

    if (writeError) {
      await releaseTicketReservations(reserved);
      return { ok: false, reserved: [], error: "Couldn't reserve tickets — please try again." };
    }
    reserved.push({ ticketTypeId: item.ticket_type_id, quantity: item.quantity });
  }

  return { ok: true, reserved };
}

async function guardBookingForPayment(bookingId: string) {
  const user = await getCurrentUser();
  if (!user) return { ok: false as const, error: "Sign in to complete checkout." };

  const { booking, error } = await loadOwnedBooking(bookingId, user.id);
  if (!booking) return { ok: false as const, error: error ?? "Booking not found." };
  if (booking.status === "confirmed" || booking.status === "completed") {
    return { ok: false as const, error: "This booking is already paid.", alreadyPaid: true as const };
  }
  if (booking.status !== "pending") {
    return { ok: false as const, error: "This booking can no longer be paid." };
  }
  if (!booking.ticket_items.length) {
    return { ok: false as const, error: "This booking has no tickets." };
  }
  return { ok: true as const, user, booking };
}

const paySchema = z.object({
  bookingId: z.string().uuid(),
  cardLast4: z
    .string()
    .regex(/^\d{4}$/, "Enter the last 4 digits")
    .optional(),
});

export type PayForBookingInput = z.infer<typeof paySchema>;

export interface PayForBookingResult extends ActionResult {
  status?: "paid" | "failed";
}

/**
 * Dev/test checkout: reserves inventory, charges via the active
 * synchronous provider (services/payments — defaults to the dev
 * provider), and finalizes immediately. Used when PAYMENT_PROVIDER
 * is unset or "dev". For "sslcommerz", the checkout page instead
 * calls initiateSslcommerzCheckout (redirect flow, below).
 */
export async function payForBooking(input: PayForBookingInput): Promise<PayForBookingResult> {
  const parsed = paySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid payment details." };
  }

  const guard = await guardBookingForPayment(parsed.data.bookingId);
  if (!guard.ok) {
    if (guard.alreadyPaid) return { ok: true, status: "paid" };
    return { ok: false, error: guard.error };
  }
  const { user, booking } = guard;

  const reservation = await reserveTicketInventory(booking);
  if (!reservation.ok) return { ok: false, error: reservation.error };

  const supabase = createClient();
  const { data: payment, error: paymentInsertError } = await supabase
    .from("payments")
    .insert({
      booking_id: booking.id,
      user_id: user.id,
      amount: booking.subtotal,
      currency: booking.currency,
      status: "pending",
      provider: getPaymentProvider().name,
      card_last4: parsed.data.cardLast4 ?? null,
    })
    .select("id")
    .single();

  if (paymentInsertError || !payment) {
    await releaseTicketReservations(reservation.reserved);
    return { ok: false, error: paymentInsertError?.message ?? "Couldn't start payment." };
  }

  const charge = await getPaymentProvider().charge({
    bookingId: booking.id,
    amount: booking.subtotal,
    currency: booking.currency,
    cardLast4: parsed.data.cardLast4,
  });

  if (!charge.ok) {
    const admin = createAdminClient();
    await admin.from("payments").update({ status: "failed" }).eq("id", payment.id);
    await releaseTicketReservations(reservation.reserved);
    return { ok: false, error: charge.error ?? "Payment failed. Please try again.", status: "failed" };
  }

  await finalizeBookingPayment(booking, payment.id, charge.reference ?? null);
  return { ok: true, status: "paid" };
}

export interface InitiateSslcommerzResult extends ActionResult {
  gatewayUrl?: string;
}

/**
 * SSLCommerz checkout: reserves inventory and records a pending
 * payment exactly like payForBooking, but instead of charging
 * synchronously, opens a gateway session and returns its URL — the
 * browser redirects the customer there. The booking is only
 * confirmed once SSLCommerz calls back
 * app/api/payments/sslcommerz/{ipn,success} and we've independently
 * validated the transaction (see lib/payments/finalize-booking.ts).
 */
export async function initiateSslcommerzCheckout(bookingId: string): Promise<InitiateSslcommerzResult> {
  if (!isSslcommerzConfigured()) {
    return { ok: false, error: "SSLCommerz is not configured yet. Add SSLCOMMERZ_STORE_ID and SSLCOMMERZ_STORE_PASSWORD to .env.local." };
  }

  const guard = await guardBookingForPayment(bookingId);
  if (!guard.ok) {
    if (guard.alreadyPaid) return { ok: false, error: "This booking is already paid." };
    return { ok: false, error: guard.error };
  }
  const { user, booking } = guard;

  const reservation = await reserveTicketInventory(booking);
  if (!reservation.ok) return { ok: false, error: reservation.error };

  const supabase = createClient();
  const { data: payment, error: paymentInsertError } = await supabase
    .from("payments")
    .insert({
      booking_id: booking.id,
      user_id: user.id,
      amount: booking.subtotal,
      currency: booking.currency,
      status: "pending",
      provider: "sslcommerz",
    })
    .select("id")
    .single();

  if (paymentInsertError || !payment) {
    await releaseTicketReservations(reservation.reserved);
    return { ok: false, error: paymentInsertError?.message ?? "Couldn't start payment." };
  }

  const session = await createSslcommerzSession({
    paymentId: payment.id,
    amount: booking.subtotal,
    customerName: booking.customer_name,
    customerEmail: booking.customer_email,
  });

  if (!session.ok || !session.gatewayUrl) {
    const admin = createAdminClient();
    await admin.from("payments").update({ status: "failed" }).eq("id", payment.id);
    await releaseTicketReservations(reservation.reserved);
    return { ok: false, error: session.error ?? "Couldn't start SSLCommerz checkout." };
  }

  return { ok: true, gatewayUrl: session.gatewayUrl };
}

export async function cancelBooking(bookingId: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Sign in to manage this booking." };

  const supabase = createClient();
  const { error } = await supabase
    .from("bookings")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("id", bookingId)
    .eq("user_id", user.id)
    .eq("status", "pending");

  if (error) return { ok: false, error: error.message };
  revalidatePath(`/checkout/${bookingId}`);
  return { ok: true };
}
