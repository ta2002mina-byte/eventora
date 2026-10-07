import type { Metadata } from "next";
import Link from "next/link";
import { ClipboardList, Building2, Store, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { getCurrentUser } from "@/lib/auth";
import { getUserBookings } from "@/lib/data/dashboard";

export const metadata: Metadata = { title: "Bookings" };

function formatDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

const statusVariant = {
  pending: "warning",
  confirmed: "success",
  cancelled: "danger",
  completed: "purple",
} as const;

function statusBadge(status: string) {
  return statusVariant[status as keyof typeof statusVariant] ?? "gray";
}

export default async function DashboardBookingsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const bookings = await getUserBookings(user.id);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <div>
        <h2 className="text-2xl font-medium">Bookings</h2>
        <p className="mt-1 text-sm text-charcoal-400">
          Venue booking requests and vendor quote requests you&apos;ve sent.
        </p>
      </div>

      {bookings.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={<ClipboardList className="h-5 w-5" />}
            title="No bookings yet"
            description="Request a venue or vendor from the marketplace and it will appear here."
            className="mb-2"
          />
          <div className="flex justify-center gap-2">
            <Link href="/venues">
              <Button variant="outline" size="sm">
                Browse venues
              </Button>
            </Link>
            <Link href="/vendors">
              <Button variant="outline" size="sm">
                Browse vendors
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {bookings.map((booking) => (
            <Card key={`${booking.kind}-${booking.id}`}>
              <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-lavender-100 text-purple-700">
                    {booking.kind === "venue" ? (
                      <Building2 className="h-5 w-5" />
                    ) : (
                      <Store className="h-5 w-5" />
                    )}
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-medium text-charcoal">{booking.targetName}</p>
                      <Badge variant="gray">{booking.kind}</Badge>
                    </div>
                    <p className="mt-0.5 text-sm text-charcoal-400">
                      {booking.eventName} · {formatDate(booking.eventDate)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={statusBadge(booking.status)}>{booking.status}</Badge>
                  <Link
                    href={booking.targetHref}
                    aria-label={`View ${booking.targetName}`}
                    className="text-purple-700 hover:text-purple-900"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
