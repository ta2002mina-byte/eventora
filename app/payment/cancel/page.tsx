import type { Metadata } from "next";
import Link from "next/link";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { getCurrentUser } from "@/lib/auth";
import { getUserBookingById } from "@/lib/data/booking";

export const metadata: Metadata = { title: "Order Cancelled" };

interface PageProps {
  searchParams: { bookingId?: string };
}

export default async function PaymentCancelPage({ searchParams }: PageProps) {
  const user = await getCurrentUser();
  const booking =
    user && searchParams.bookingId ? await getUserBookingById(searchParams.bookingId, user.id) : null;

  return (
    <main className="container-page py-14 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-charcoal-100 text-charcoal-400">
        <XCircle className="h-8 w-8" />
      </div>
      <h1 className="mt-5 text-3xl font-medium">Order cancelled</h1>
      <p className="mx-auto mt-2 max-w-md text-charcoal-400">
        No payment was made{booking?.event ? ` for ${booking.event.title}` : ""}. You can start a new
        order any time.
      </p>

      <div className="mt-8 flex justify-center gap-3">
        {booking?.event ? (
          <Link href={`/booking/${booking.event.id}`}>
            <Button>Try Again</Button>
          </Link>
        ) : (
          <Link href="/events">
            <Button>Browse Events</Button>
          </Link>
        )}
        <Link href="/dashboard/bookings">
          <Button variant="outline">My Bookings</Button>
        </Link>
      </div>
    </main>
  );
}
