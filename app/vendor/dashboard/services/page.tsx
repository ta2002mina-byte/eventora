import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { getVendorForOwner } from "@/lib/data/vendor-dashboard";
import { VendorServicesManager } from "@/components/vendor-dashboard/VendorServicesManager";

export const metadata: Metadata = { title: "Services" };

export default async function VendorServicesPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const vendor = await getVendorForOwner(user.id);
  if (!vendor) return null;

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
      <div>
        <h2 className="text-2xl font-medium">Services</h2>
        <p className="mt-1 text-sm text-charcoal-400">
          Individual, à la carte offerings customers can request on top of a package.
        </p>
      </div>
      <div className="mt-6">
        <VendorServicesManager services={vendor.vendor_services} currency={vendor.currency} />
      </div>
    </main>
  );
}
