import { NextRequest, NextResponse } from "next/server";
import { validateSslcommerzTransaction } from "@/services/payments/providers/sslcommerz";
import { loadPaymentForCallback, finalizeBookingPayment } from "@/lib/payments/finalize-booking";

/**
 * Browser lands here (via SSLCommerz's POST redirect) right after
 * completing payment. We still independently validate val_id — never
 * trust this request's fields alone, since a browser POST isn't
 * authenticated. The IPN route (server-to-server) is the other,
 * independent confirmation path; either one finalizing is enough
 * (finalizeBookingPayment is idempotent-safe via the status check).
 */
export async function POST(request: NextRequest) {
  const form = await request.formData();
  const valId = form.get("val_id")?.toString();
  const tranId = form.get("tran_id")?.toString();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? request.nextUrl.origin;

  if (!valId || !tranId) {
    return NextResponse.redirect(`${siteUrl}/payment/cancel`);
  }

  const { payment, booking } = await loadPaymentForCallback(tranId);
  if (!payment || !booking) {
    return NextResponse.redirect(`${siteUrl}/payment/cancel`);
  }

  if (payment.status !== "paid") {
    const valid = await validateSslcommerzTransaction(valId);
    if (!valid) {
      return NextResponse.redirect(`${siteUrl}/payment/cancel?bookingId=${booking.id}`);
    }
    await finalizeBookingPayment(booking, payment.id, tranId);
  }

  return NextResponse.redirect(`${siteUrl}/payment/success?bookingId=${booking.id}`);
}
