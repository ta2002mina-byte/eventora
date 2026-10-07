import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Ticket as TicketIcon, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { getCurrentUser } from "@/lib/auth";
import { getUserBookingById, getTicketsForBooking } from "@/lib/data/booking";

export const metadata: Metadata = { title: "Payment Successful" };

interface PageProps {
  searchParams: { bookingId?: string };
}

export default async function PaymentSuccessPage({ searchParams }: PageProps) {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <main className="container-page py-16 text-center">
        <p className="text-charcoal-600">Sign in to view your order.</p>
        <Link href="/auth/login" className="mt-4 inline-block">
          <Button size="sm">Sign In</Button>
        </Link>
      </main>
    );
  }

  const bookingId = searchParams.bookingId;
  const booking = bookingId ? await getUserBookingById(bookingId, user.id) : null;

  if (!booking || (booking.status !== "confirmed" && booking.status !== "completed")) {
    return (
      <main className="container-page py-16">
        <EmptyState
          title="We couldn't find that order"
          description="If you just paid, check My Tickets — it may still be finalizing."
        />
        <div className="mt-6 text-center">
          <Link href="/tickets" className="text-sm font-medium text-purple-700 hover:underline">
            Go to My Tickets
          </Link>
        </div>
      </main>
    );
  }

  const tickets = await getTicketsForBooking(booking.id, user.id);

  return (
    <main className="container-page py-14 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-green-600">
        <CheckCircle2 className="h-8 w-8" />
      </div>
      <h1 className="mt-5 text-3xl font-medium">Payment successful</h1>
      <p className="mt-2 text-charcoal-400">
        {tickets.length} ticket{tickets.length === 1 ? "" : "s"} confirmed for{" "}
        {booking.event?.title ?? "your event"}.
      </p>

      <Card className="mx-auto mt-8 max-w-lg text-left">
        <CardContent className="p-5">
          <ul className="space-y-2">
            {booking.ticket_items.map((item) => (
              <li key={item.id} className="flex items-center justify-between text-sm">
                <span className="text-charcoal-600">
                  {item.name} × {item.quantity}
                </span>
                <span className="text-charcoal">
                  {item.subtotal > 0 ? `${booking.currency} ${item.subtotal.toLocaleString()}` : "Free"}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
            <span className="text-sm font-medium text-charcoal">Total paid</span>
            <span className="text-lg font-medium text-charcoal">
              {booking.subtotal > 0 ? `${booking.currency} ${booking.subtotal.toLocaleString()}` : "Free"}
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="mx-auto mt-8 flex max-w-lg justify-center gap-3">
        <Link href="/tickets">
          <Button leftIcon={<TicketIcon className="h-4 w-4" />}>View My Tickets</Button>
        </Link>
        {booking.event && (
          <Link href={`/events/${booking.event.id}`}>
            <Button variant="outline" rightIcon={<ArrowRight className="h-4 w-4" />}>
              Back to Event
            </Button>
          </Link>
        )}
      </div>
    </main>
  );
}
