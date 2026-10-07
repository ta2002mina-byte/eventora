import Link from "next/link";
import { VendorCard } from "@/components/vendors/VendorCard";
import { getFeaturedVendors } from "@/lib/data/home";

export async function FeaturedVendors() {
  const vendors = await getFeaturedVendors();
  if (vendors.length === 0) return null;
  return (
    <section className="bg-white py-16">
      <div className="container-page">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl">Featured vendors</h2>
            <p className="mt-2 text-charcoal-400">Photographers, caterers, decorators and more.</p>
          </div>
          <Link href="/vendors" className="hidden text-sm font-medium text-purple-700 hover:underline sm:block">
            View all vendors
          </Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {vendors.map((vendor) => (
            <VendorCard key={vendor.id} vendor={vendor} />
          ))}
        </div>
      </div>
    </section>
  );
}
