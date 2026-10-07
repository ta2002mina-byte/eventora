"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, X, CheckCircle2, Ban, ClipboardList, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { AcceptBookingModal } from "@/components/vendor-dashboard/AcceptBookingModal";
import { updateVendorBookingStatus, markVendorBookingPaid } from "@/app/vendor/dashboard/actions";
import { profileDisplayName } from "@/types/profile";
import { VENDOR_BOOKING_STATUS_LABELS } from "@/types/vendor";
import type { VendorBookingWithCustomer } from "@/lib/data/vendor-dashboard";

const statusVariant = {
  pending: "warning",
  confirmed: "success",
  cancelled: "danger",
  completed: "purple",
} as const;

function formatDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function VendorBookingsList({
  bookings,
  currency,
}: {
  bookings: VendorBookingWithCustomer[];
  currency: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [acceptingId, setAcceptingId] = React.useState<string | null>(null);
  const [pendingId, setPendingId] = React.useState<string | null>(null);

  async function handleAction(bookingId: string, status: "cancelled" | "completed") {
    setPendingId(bookingId);
    const result = await updateVendorBookingStatus({ bookingId, status });
    setPendingId(null);
    if (!result.ok) {
      toast({ variant: "error", title: "Couldn't update booking", description: result.error });
      return;
    }
    toast({ variant: "success", title: status === "cancelled" ? "Booking cancelled" : "Booking completed" });
    router.refresh();
  }

  async function handleMarkPaid(bookingId: string) {
    setPendingId(bookingId);
    const result = await markVendorBookingPaid(bookingId);
    setPendingId(null);
    if (!result.ok) {
      toast({ variant: "error", title: "Couldn't update payment", description: result.error });
      return;
    }
    toast({ variant: "success", title: "Marked as paid" });
    router.refresh();
  }

  if (bookings.length === 0) {
    return (
      <EmptyState
        icon={<ClipboardList className="h-6 w-6" />}
        title="No booking requests yet"
        description="Quote requests from customers will appear here."
      />
    );
  }

  return (
    <div className="space-y-3">
      {bookings.map((booking) => (
        <Card key={booking.id}>
          <CardContent className="flex flex-wrap items-start justify-between gap-4 p-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium text-charcoal">{booking.event_name}</p>
                <Badge variant={statusVariant[booking.status]}>
                  {VENDOR_BOOKING_STATUS_LABELS[booking.status]}
                </Badge>
                {booking.status !== "pending" && booking.status !== "cancelled" && (
                  <Badge variant={booking.payment_status === "paid" ? "success" : "gray"}>
                    {booking.payment_status === "paid" ? "Paid" : "Unpaid"}
                  </Badge>
                )}
              </div>
              <p className="mt-1 text-sm text-charcoal-400">
                {profileDisplayName(booking.customer)} · {formatDate(booking.event_date)} ·{" "}
                {booking.guest_count} guests
              </p>
              {booking.service_name && (
                <p className="mt-0.5 text-sm text-charcoal-400">Requested: {booking.service_name}</p>
              )}
              {booking.notes && <p className="mt-1 text-sm text-charcoal-600">&ldquo;{booking.notes}&rdquo;</p>}
              <p className="mt-1 text-sm font-medium text-purple-700">
                {booking.amount != null
                  ? `${currency} ${booking.amount.toLocaleString()}`
                  : booking.budget != null
                    ? `Budget: ${currency} ${booking.budget.toLocaleString()}`
                    : "No budget given"}
              </p>
            </div>

            <div className="flex shrink-0 flex-wrap gap-2">
              {booking.status === "pending" && (
                <>
                  <Button
                    size="sm"
                    leftIcon={<Check className="h-4 w-4" />}
                    onClick={() => setAcceptingId(booking.id)}
                  >
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    leftIcon={<X className="h-4 w-4" />}
                    isLoading={pendingId === booking.id}
                    onClick={() => handleAction(booking.id, "cancelled")}
                  >
                    Reject
                  </Button>
                </>
              )}
              {booking.status === "confirmed" && (
                <>
                  <Button
                    size="sm"
                    leftIcon={<CheckCircle2 className="h-4 w-4" />}
                    isLoading={pendingId === booking.id}
                    onClick={() => handleAction(booking.id, "completed")}
                  >
                    Mark completed
                  </Button>
                  {booking.payment_status !== "paid" && (
                    <Button
                      size="sm"
                      variant="outline"
                      leftIcon={<Wallet className="h-4 w-4" />}
                      isLoading={pendingId === booking.id}
                      onClick={() => handleMarkPaid(booking.id)}
                    >
                      Mark paid
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    leftIcon={<Ban className="h-4 w-4" />}
                    isLoading={pendingId === booking.id}
                    onClick={() => handleAction(booking.id, "cancelled")}
                  >
                    Cancel
                  </Button>
                </>
              )}
              {booking.status === "completed" && booking.payment_status !== "paid" && (
                <Button
                  size="sm"
                  variant="outline"
                  leftIcon={<Wallet className="h-4 w-4" />}
                  isLoading={pendingId === booking.id}
                  onClick={() => handleMarkPaid(booking.id)}
                >
                  Mark paid
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      <AcceptBookingModal
        open={!!acceptingId}
        onClose={() => setAcceptingId(null)}
        bookingId={acceptingId ?? ""}
        suggestedAmount={bookings.find((b) => b.id === acceptingId)?.budget ?? 0}
      />
    </div>
  );
}
