import { NextRequest, NextResponse } from "next/server";
import { validateSslcommerzTransaction } from "@/services/payments/providers/sslcommerz";
import { loadPaymentForCallback, finalizeBookingPayment } from "@/lib/payments/finalize-booking";

/**
 * SSLCommerz IPN (Instant Payment Notification) — a server-to-server
 * POST SSLCommerz sends independently of the customer's browser. This
 * is the authoritative confirmation: always re-validate val_id here
 * before marking anything paid, even though success/route.ts also
 * validates on the browser-redirect path. Must respond 200 quickly or
 * SSLCommerz will retry.
 */
export async function POST(request: NextRequest) {
  const form = await request.formData();
  const valId = form.get("val_id")?.toString();
  const tranId = form.get("tran_id")?.toString(); // this is the payments.id row

  if (!valId || !tranId) {
    return NextResponse.json({ ok: false, error: "Missing val_id/tran_id" }, { status: 400 });
  }

  const { payment, booking } = await loadPaymentForCallback(tranId);
  if (!payment || !booking) {
    return NextResponse.json({ ok: false, error: "Unknown payment" }, { status: 404 });
  }

  if (payment.status === "paid") {
    return NextResponse.json({ ok: true, note: "Already finalized" });
  }

  const valid = await validateSslcommerzTransaction(valId);
  if (!valid) {
    return NextResponse.json({ ok: false, error: "Transaction did not validate" }, { status: 400 });
  }

  await finalizeBookingPayment(booking, payment.id, tranId);
  return NextResponse.json({ ok: true });
}
