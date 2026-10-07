import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { getVendorForOwner, getVendorBookings } from "@/lib/data/vendor-dashboard";
import { VendorBookingsList } from "@/components/vendor-dashboard/VendorBookingsList";
import { VendorBookingsTabs } from "@/components/vendor-dashboard/VendorBookingsTabs";
import type { VendorBookingRecord } from "@/types/vendor";

export const metadata: Metadata = { title: "Bookings" };

const VALID_STATUSES: VendorBookingRecord["status"][] = [
  "pending",
  "confirmed",
  "completed",
  "cancelled",
];

export default async function VendorBookingsPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const user = await getCurrentUser();
  if (!user) return null;
  const vendor = await getVendorForOwner(user.id);
  if (!vendor) return null;

  const status = VALID_STATUSES.includes(searchParams.status as VendorBookingRecord["status"])
    ? (searchParams.status as VendorBookingRecord["status"])
    : undefined;

  const bookings = await getVendorBookings(vendor.id, status);

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <div>
        <h2 className="text-2xl font-medium">Bookings</h2>
        <p className="mt-1 text-sm text-charcoal-400">
          Quote requests customers have sent you, and bookings you&apos;ve confirmed.
        </p>
      </div>

      <div className="mt-4">
        <VendorBookingsTabs active={status} />
      </div>

      <div className="mt-6">
        <VendorBookingsList bookings={bookings} currency={vendor.currency} />
      </div>
    </main>
  );
}
