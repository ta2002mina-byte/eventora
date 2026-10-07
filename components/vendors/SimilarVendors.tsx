import { VendorCard } from "@/components/vendors/VendorCard";
import type { VendorRecord } from "@/types/vendor";

export function SimilarVendors({
  vendors,
  favoriteIds,
}: {
  vendors: VendorRecord[];
  favoriteIds: Set<string>;
}) {
  if (vendors.length === 0) return null;

  return (
    <div className="mt-12">
      <h2 className="text-xl">Similar vendors</h2>
      <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {vendors.map((vendor) => (
          <VendorCard key={vendor.id} vendor={vendor} favorited={favoriteIds.has(vendor.id)} />
        ))}
      </div>
    </div>
  );
}
