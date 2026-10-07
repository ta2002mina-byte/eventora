import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { getVendorForOwner } from "@/lib/data/vendor-dashboard";
import { VendorAvailabilityEditor } from "@/components/vendor-dashboard/VendorAvailabilityEditor";

export const metadata: Metadata = { title: "Calendar" };

export default async function VendorCalendarPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const vendor = await getVendorForOwner(user.id);
  if (!vendor) return null;

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <div>
        <h2 className="text-2xl font-medium">Calendar</h2>
        <p className="mt-1 text-sm text-charcoal-400">
          Click a date to mark it available, booked or blocked. Customers see this on your public
          profile.
        </p>
      </div>
      <div className="mt-6">
        <VendorAvailabilityEditor days={vendor.vendor_availability} />
      </div>
    </main>
  );
}
