import type { Metadata } from "next";
import { Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { getCurrentUser } from "@/lib/auth";
import { getVendorForOwner, getVendorCustomers } from "@/lib/data/vendor-dashboard";
import { profileDisplayName, profileInitials } from "@/types/profile";

export const metadata: Metadata = { title: "Customers" };

function formatDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default async function VendorCustomersPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const vendor = await getVendorForOwner(user.id);
  if (!vendor) return null;

  const customers = await getVendorCustomers(vendor.id);

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <div>
        <h2 className="text-2xl font-medium">Customers</h2>
        <p className="mt-1 text-sm text-charcoal-400">
          Customers who have requested a quote or booking from you. Only their name and booking
          history with you are shown.
        </p>
      </div>

      {customers.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={<Users className="h-6 w-6" />}
            title="No customers yet"
            description="Once someone requests a quote, they'll appear here."
          />
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {customers.map((customer) => (
            <Card key={customer.userId}>
              <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-lavender-100 text-sm font-medium text-purple-700">
                    {profileInitials(customer.profile)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-charcoal">
                      {profileDisplayName(customer.profile)}
                    </p>
                    <p className="truncate text-sm text-charcoal-400">
                      {customer.bookingCount} booking{customer.bookingCount === 1 ? "" : "s"} · Last{" "}
                      {formatDate(customer.lastBookingDate)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {customer.totalSpent > 0 && (
                    <span className="text-sm font-medium text-purple-700">
                      {vendor.currency} {customer.totalSpent.toLocaleString()}
                    </span>
                  )}
                  <Badge variant="gray">{[...new Set(customer.statuses)].join(", ")}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
