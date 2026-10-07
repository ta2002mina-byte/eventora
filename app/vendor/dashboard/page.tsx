import type { Metadata } from "next";
import Link from "next/link";
import {
  ClipboardList,
  Wallet,
  Star,
  Sparkles,
  ArrowRight,
  CalendarDays,
  MessageSquare,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatCard } from "@/components/dashboard/StatCard";
import { getCurrentUser } from "@/lib/auth";
import { getVendorForOwner, getVendorDashboardOverview } from "@/lib/data/vendor-dashboard";
import { profileDisplayName } from "@/types/profile";
import { formatVendorPrice } from "@/types/vendor";

export const metadata: Metadata = { title: "Vendor Dashboard" };

const bookingStatusVariant = {
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

export default async function VendorDashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null; // layout renders the sign-in gate

  const vendor = await getVendorForOwner(user.id);
  if (!vendor) return null; // layout renders the onboarding gate

  const overview = await getVendorDashboardOverview(vendor);
  const { bookingStats, upcomingBookings, pendingQuotes, earnings, reviewStats, recentActivity } =
    overview;

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-charcoal-400">Welcome back</p>
          <h2 className="text-2xl font-medium">{vendor.business_name}</h2>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={vendor.status === "published" ? "success" : "gray"}>
            {vendor.status === "published" ? "Live on marketplace" : "Draft"}
          </Badge>
          <Link href={`/vendors/${vendor.slug}`}>
            <Button variant="outline" size="sm" rightIcon={<ArrowRight className="h-4 w-4" />}>
              View public page
            </Button>
          </Link>
        </div>
      </div>

      {pendingQuotes.length > 0 && (
        <Card className="mt-6 overflow-hidden border-gold-200 bg-gradient-to-r from-gold-50 to-lavender-50">
          <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold-100 text-gold-600">
                <Sparkles className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-base font-medium text-charcoal">
                  {pendingQuotes.length} new quote request{pendingQuotes.length === 1 ? "" : "s"}
                </h3>
                <p className="text-sm text-charcoal-400">Respond quickly to win more bookings.</p>
              </div>
            </div>
            <Link href="/vendor/dashboard/bookings">
              <Button size="sm">Review requests</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          icon={ClipboardList}
          label="Booking requests"
          value={String(bookingStats.total)}
          hint={bookingStats.pending > 0 ? `${bookingStats.pending} pending` : "View bookings"}
          href="/vendor/dashboard/bookings"
        />
        <StatCard
          icon={CalendarDays}
          label="Upcoming bookings"
          value={String(upcomingBookings.length)}
          hint="View calendar"
          href="/vendor/dashboard/calendar"
        />
        <StatCard
          icon={Wallet}
          label="Total earnings"
          value={earnings.total.toLocaleString()}
          hint={earnings.pending > 0 ? `${earnings.pending.toLocaleString()} pending` : "View earnings"}
          href="/vendor/dashboard/earnings"
        />
        <StatCard
          icon={Star}
          label="Rating"
          value={reviewStats.count > 0 ? reviewStats.average.toFixed(1) : "—"}
          hint={reviewStats.count > 0 ? `${reviewStats.count} reviews` : "No reviews yet"}
          href="/vendor/dashboard/reviews"
        />
        <StatCard
          icon={MessageSquare}
          label="Messages"
          value="0"
          hint="Coming soon"
          href="/vendor/dashboard/messages"
        />
        <StatCard
          icon={Sparkles}
          label="Starting price"
          value={formatVendorPrice(vendor)}
          hint="Edit profile"
          href="/vendor/dashboard/profile"
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {/* Upcoming bookings */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Upcoming bookings</h3>
            <Link href="/vendor/dashboard/bookings" className="text-sm text-purple-700 hover:underline">
              See all
            </Link>
          </div>
          {upcomingBookings.length === 0 ? (
            <EmptyState
              className="mt-4"
              icon={<CalendarDays className="h-5 w-5" />}
              title="No upcoming bookings"
              description="Accepted quote requests with a future event date will appear here."
            />
          ) : (
            <div className="mt-4 space-y-3">
              {upcomingBookings.map((booking) => (
                <Card key={booking.id}>
                  <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-medium text-charcoal">{booking.event_name}</p>
                        <Badge variant={bookingStatusVariant[booking.status]}>{booking.status}</Badge>
                      </div>
                      <p className="mt-0.5 text-sm text-charcoal-400">
                        {profileDisplayName(booking.customer)} · {formatDate(booking.event_date)} ·{" "}
                        {booking.guest_count} guests
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Recent activity */}
        <div className="space-y-6">
          <Card>
            <CardContent className="p-5">
              <h3 className="text-base font-medium">Recent activity</h3>
              {recentActivity.length === 0 ? (
                <p className="mt-3 text-sm text-charcoal-400">No activity yet.</p>
              ) : (
                <ul className="mt-3 space-y-3">
                  {recentActivity.map((item) => (
                    <li key={item.id} className="text-sm">
                      <Link href={item.href} className="text-charcoal-600 hover:text-purple-700">
                        {item.label}
                      </Link>
                      <p className="text-xs text-charcoal-400">{formatDate(item.date)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <h3 className="text-base font-medium">Earnings breakdown</h3>
              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-charcoal-400">Total</dt>
                  <dd className="font-medium text-charcoal">
                    {vendor.currency} {earnings.total.toLocaleString()}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-charcoal-400">Pending</dt>
                  <dd className="font-medium text-amber-600">
                    {vendor.currency} {earnings.pending.toLocaleString()}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-charcoal-400">Completed</dt>
                  <dd className="font-medium text-emerald-600">
                    {vendor.currency} {earnings.completed.toLocaleString()}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
