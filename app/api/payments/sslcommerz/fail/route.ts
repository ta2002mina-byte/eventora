import { NextRequest, NextResponse } from "next/server";
import { loadPaymentForCallback, markPaymentFailed } from "@/lib/payments/finalize-booking";

/** SSLCommerz redirects here when the gateway declines the payment. */
export async function POST(request: NextRequest) {
  const form = await request.formData();
  const tranId = form.get("tran_id")?.toString();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? request.nextUrl.origin;

  if (tranId) {
    const { payment, booking } = await loadPaymentForCallback(tranId);
    if (payment && booking && payment.status === "pending") {
      await markPaymentFailed(payment.id, booking);
    }
    if (booking) {
      return NextResponse.redirect(`${siteUrl}/payment/cancel?bookingId=${booking.id}`);
    }
  }

  return NextResponse.redirect(`${siteUrl}/payment/cancel`);
}
