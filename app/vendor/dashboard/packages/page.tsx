import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { getVendorForOwner } from "@/lib/data/vendor-dashboard";
import { VendorPackagesManager } from "@/components/vendor-dashboard/VendorPackagesManager";

export const metadata: Metadata = { title: "Packages" };

export default async function VendorPackagesPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const vendor = await getVendorForOwner(user.id);
  if (!vendor) return null;

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <div>
        <h2 className="text-2xl font-medium">Packages</h2>
        <p className="mt-1 text-sm text-charcoal-400">
          Bundled offerings with a fixed price customers can book directly.
        </p>
      </div>
      <div className="mt-6">
        <VendorPackagesManager packages={vendor.vendor_packages} currency={vendor.currency} />
      </div>
    </main>
  );
}
