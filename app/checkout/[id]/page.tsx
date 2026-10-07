import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { getCurrentUser } from "@/lib/auth";
import { getUserBookingById } from "@/lib/data/booking";
import { isSslcommerzConfigured } from "@/services/payments/providers/sslcommerz";
import { CheckoutForm } from "@/components/booking/CheckoutForm";

interface PageProps {
  params: { id: string };
}

export const metadata: Metadata = { title: "Checkout" };

export default async function CheckoutPage({ params }: PageProps) {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <main className="container-page py-16 text-center">
        <p className="text-charcoal-600">Sign in to complete checkout.</p>
        <Link href="/auth/login" className="mt-4 inline-block">
          <Button size="sm">Sign In</Button>
        </Link>
      </main>
    );
  }

  const booking = await getUserBookingById(params.id, user.id);
  if (!booking) notFound();

  if (booking.status === "confirmed" || booking.status === "completed") {
    redirect(`/payment/success?bookingId=${booking.id}`);
  }

  if (booking.status === "cancelled") {
    return (
      <main className="container-page py-16">
        <EmptyState
          title="This order was cancelled"
          description="Start a new order from the event page if you'd still like tickets."
        />
        {booking.event && (
          <div className="mt-6 text-center">
            <Link href={`/events/${booking.event.id}`} className="text-sm font-medium text-purple-700 hover:underline">
              Back to {booking.event.title}
            </Link>
          </div>
        )}
      </main>
    );
  }

  return (
    <main className="container-page py-10 sm:py-14">
      {booking.event && (
        <Link
          href={`/booking/${booking.event.id}`}
          className="inline-flex items-center gap-1.5 text-sm text-charcoal-400 hover:text-purple-700"
        >
          <ArrowLeft className="h-4 w-4" /> {booking.event.title}
        </Link>
      )}
      <h1 className="mt-3 text-3xl font-medium">Checkout</h1>
      <p className="mt-1 text-charcoal-400">Review your order and complete payment.</p>

      <div className="mt-8">
        <CheckoutForm
          bookingId={booking.id}
          currency={booking.currency}
          subtotal={booking.subtotal}
          items={booking.ticket_items}
          isGatewayConfigured={isSslcommerzConfigured()}
        />
      </div>
    </main>
  );
}
