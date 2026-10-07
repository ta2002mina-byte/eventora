"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { assertAdmin, logAudit } from "@/lib/admin/auth";
import {
  finalizeBookingPayment,
  releaseReservationsForBooking,
  type BookingForFinalization,
} from "@/lib/payments/finalize-booking";

/* eslint-disable @typescript-eslint/no-explicit-any */

function refresh(id: string) {
  revalidatePath(`/admin/bookings/${id}`);
  revalidatePath("/admin/bookings");
  revalidatePath("/admin/payments");
  revalidatePath("/admin/tickets");
  revalidatePath("/tickets");
  revalidatePath("/dashboard/bookings");
}

async function loadBooking(admin: any, id: string) {
  const { data } = await admin.from("bookings").select("*, ticket_items(*)").eq("id", id).maybeSingle();
  return data as (BookingForFinalization & { status: string; subtotal: number; currency: string }) | null;
}

/** Marks an order paid (e.g. cash / bank transfer received) and issues its tickets. */
export async function markBookingPaid(bookingId: string, _fd?: FormData): Promise<void> {
  const { user, admin } = await assertAdmin();
  const booking = await loadBooking(admin, bookingId);
  if (!booking) redirect("/admin/bookings");
  const back = `/admin/bookings/${bookingId}`;
  if (booking.status === "cancelled") redirect(`${back}?error=cancelled`);

  const { data: payments } = await admin
    .from("payments")
    .select("id, status")
    .eq("booking_id", bookingId)
    .order("created_at", { ascending: false });
  const list = (payments ?? []) as { id: string; status: string }[];
  if (list.some((p) => p.status === "paid")) redirect(`${back}?error=already-paid`);

  let paymentId = list.find((p) => p.status === "pending")?.id;

  if (!paymentId) {
    // No inventory is being held for this order yet — reserve it now.
    for (const item of booking.ticket_items.filter((i) => i.ticket_type_id)) {
      const { data: t } = await admin
        .from("event_ticket_types")
        .select("quantity_total, quantity_sold")
        .eq("id", item.ticket_type_id)
        .maybeSingle();
      if (!t || t.quantity_sold + item.quantity > t.quantity_total) redirect(`${back}?error=sold-out`);
    }
    for (const item of booking.ticket_items.filter((i) => i.ticket_type_id)) {
      const { data: t } = await admin.from("event_ticket_types").select("quantity_sold").eq("id", item.ticket_type_id).maybeSingle();
      await admin
        .from("event_ticket_types")
        .update({ quantity_sold: (t?.quantity_sold ?? 0) + item.quantity })
        .eq("id", item.ticket_type_id);
    }
    const { data: created, error } = await admin
      .from("payments")
      .insert({
        booking_id: bookingId,
        user_id: booking.user_id,
        amount: booking.subtotal,
        currency: booking.currency,
        status: "pending",
        provider: "manual",
      })
      .select("id")
      .single();
    if (error || !created) redirect(`${back}?error=failed`);
    paymentId = created.id as string;
  }

  const { count: existingTickets } = await admin
    .from("tickets")
    .select("id", { count: "exact", head: true })
    .eq("booking_id", bookingId);

  if ((existingTickets ?? 0) > 0) {
    // Tickets were already issued — just settle the payment + order.
    await admin.from("payments").update({ status: "paid", paid_at: new Date().toISOString() }).eq("id", paymentId);
    await admin.from("bookings").update({ status: "confirmed", updated_at: new Date().toISOString() }).eq("id", bookingId);
  } else {
    await finalizeBookingPayment(booking, paymentId as string, `manual-${user.id.slice(0, 8)}`);
  }

  await logAudit(user, "mark_paid", "bookings", bookingId);
  refresh(bookingId);
  redirect(`${back}?done=paid`);
}

/** Cancels an order: cancels its tickets, frees inventory, optionally marks the payment refunded. */
export async function cancelBooking(bookingId: string, refund: boolean, _fd?: FormData): Promise<void> {
  const { user, admin } = await assertAdmin();
  const booking = await loadBooking(admin, bookingId);
  if (!booking) redirect("/admin/bookings");
  const back = `/admin/bookings/${bookingId}`;
  if (booking.status === "cancelled") redirect(`${back}?error=already-cancelled`);

  const { data: payments } = await admin.from("payments").select("id, status").eq("booking_id", bookingId);
  const list = (payments ?? []) as { id: string; status: string }[];
  // Inventory is held while a payment attempt is pending or paid.
  const holdsInventory = list.some((p) => p.status === "pending" || p.status === "paid");

  await admin.from("bookings").update({ status: "cancelled", updated_at: new Date().toISOString() }).eq("id", bookingId);
  await admin.from("tickets").update({ status: "cancelled" }).eq("booking_id", bookingId).eq("status", "valid");
  await admin.from("payments").update({ status: refund ? "refunded" : "failed" }).eq("booking_id", bookingId).eq("status", refund ? "paid" : "pending");
  if (refund) await admin.from("payments").update({ status: "failed" }).eq("booking_id", bookingId).eq("status", "pending");

  if (holdsInventory) await releaseReservationsForBooking(booking);

  await logAudit(user, refund ? "cancel_refund" : "cancel", "bookings", bookingId);
  refresh(bookingId);
  redirect(`${back}?done=${refund ? "refunded" : "cancelled"}`);
}

export async function completeBooking(bookingId: string, _fd?: FormData): Promise<void> {
  const { user, admin } = await assertAdmin();
  const { data: booking } = await admin.from("bookings").select("status").eq("id", bookingId).maybeSingle();
  if (!booking) redirect("/admin/bookings");
  if (booking.status !== "confirmed") redirect(`/admin/bookings/${bookingId}?error=not-confirmed`);
  await admin.from("bookings").update({ status: "completed", updated_at: new Date().toISOString() }).eq("id", bookingId);
  await logAudit(user, "complete", "bookings", bookingId);
  refresh(bookingId);
  redirect(`/admin/bookings/${bookingId}?done=completed`);
}
