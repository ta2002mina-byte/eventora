import type { Metadata } from "next";
import { Wallet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { getCurrentUser } from "@/lib/auth";
import { getVendorForOwner, getVendorEarnings } from "@/lib/data/vendor-dashboard";
import { profileDisplayName } from "@/types/profile";
import { VENDOR_BOOKING_STATUS_LABELS } from "@/types/vendor";

export const metadata: Metadata = { title: "Earnings" };

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

export default async function VendorEarningsPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const vendor = await getVendorForOwner(user.id);
  if (!vendor) return null;

  const earnings = await getVendorEarnings(vendor.id);

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <div>
        <h2 className="text-2xl font-medium">Earnings</h2>
        <p className="mt-1 text-sm text-charcoal-400">
          Totals from confirmed and completed bookings. A full payments system arrives in a later
          phase.
        </p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-charcoal-400">Total</p>
            <p className="mt-2 text-2xl font-medium text-charcoal">
              {vendor.currency} {earnings.total.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-charcoal-400">Pending</p>
            <p className="mt-2 text-2xl font-medium text-amber-600">
              {vendor.currency} {earnings.pending.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-charcoal-400">Completed</p>
            <p className="mt-2 text-2xl font-medium text-emerald-600">
              {vendor.currency} {earnings.completed.toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-medium">Transaction history</h3>
        {earnings.transactions.length === 0 ? (
          <EmptyState
            className="mt-4"
            icon={<Wallet className="h-6 w-6" />}
            title="No transactions yet"
            description="Accepted bookings with an agreed amount will appear here."
          />
        ) : (
          <div className="mt-4 space-y-3">
            {earnings.transactions.map((t) => (
              <Card key={t.id}>
                <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-medium text-charcoal">{t.event_name}</p>
                      <Badge variant={statusVariant[t.status]}>{VENDOR_BOOKING_STATUS_LABELS[t.status]}</Badge>
                      <Badge variant={t.payment_status === "paid" ? "success" : "gray"}>
                        {t.payment_status === "paid" ? "Paid" : "Unpaid"}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-sm text-charcoal-400">
                      {profileDisplayName(t.customer)} · {formatDate(t.event_date)}
                    </p>
                  </div>
                  <p className="text-sm font-medium text-purple-700">
                    {vendor.currency} {(t.amount ?? t.budget ?? 0).toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
