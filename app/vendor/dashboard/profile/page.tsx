import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { getCurrentUser } from "@/lib/auth";
import { getVendorForOwner } from "@/lib/data/vendor-dashboard";
import { VendorProfileForm } from "@/components/vendor-dashboard/VendorProfileForm";
import { VendorPortfolioManager } from "@/components/vendor-dashboard/VendorPortfolioManager";

export const metadata: Metadata = { title: "Vendor Profile" };

export default async function VendorProfilePage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const vendor = await getVendorForOwner(user.id);
  if (!vendor) return null;

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
      <div>
        <h2 className="text-2xl font-medium">Vendor profile</h2>
        <p className="mt-1 text-sm text-charcoal-400">
          This is what customers see on your public marketplace page.
        </p>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Business details</CardTitle>
        </CardHeader>
        <CardContent>
          <VendorProfileForm vendor={vendor} />
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Portfolio</CardTitle>
        </CardHeader>
        <CardContent>
          <VendorPortfolioManager items={vendor.vendor_portfolio} />
        </CardContent>
      </Card>
    </main>
  );
}
