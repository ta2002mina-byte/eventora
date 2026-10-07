import type { Metadata } from "next";
import { Briefcase } from "lucide-react";
import { getVendors, getFavoriteVendorIds } from "@/lib/data/vendors";
import { getCurrentUser } from "@/lib/auth";
import { VendorFilters } from "@/components/vendors/VendorFilters";
import { VendorCard } from "@/components/vendors/VendorCard";
import { VendorsPagination } from "@/components/vendors/VendorsPagination";
import { EmptyState } from "@/components/ui/EmptyState";
import type { VendorCategory, VendorSortOption } from "@/types/vendor";

export const metadata: Metadata = { title: "Vendors" };

const ALLOWED_SORTS: VendorSortOption[] = [
  "recommended",
  "price_asc",
  "price_desc",
  "rating_desc",
  "experience_desc",
  "newest",
];

export default async function VendorsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) {
  const page = Number(searchParams.page ?? "1") || 1;
  const sort = ALLOWED_SORTS.includes(searchParams.sort as VendorSortOption)
    ? (searchParams.sort as VendorSortOption)
    : "recommended";

  const user = await getCurrentUser();

  const { vendors, count, pageSize } = await getVendors({
    q: searchParams.q,
    city: searchParams.city,
    category: (searchParams.category as VendorCategory) || undefined,
    minPrice: searchParams.minPrice ? Number(searchParams.minPrice) : undefined,
    maxPrice: searchParams.maxPrice ? Number(searchParams.maxPrice) : undefined,
    minRating: searchParams.minRating ? Number(searchParams.minRating) : undefined,
    availableOn: searchParams.availableOn,
    sort,
    page,
  });

  const favoriteIds = user ? await getFavoriteVendorIds(user.id) : new Set<string>();
  const totalPages = Math.max(1, Math.ceil(count / pageSize));

  return (
    <main className="container-page py-10">
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl">Vendors</h1>
        <p className="mt-2 text-charcoal-400">
          {count > 0
            ? `${count} vendor${count === 1 ? "" : "s"} to explore`
            : "Find photographers, caterers, decorators and more for your next event."}
        </p>
      </div>

      <VendorFilters />

      {vendors.length === 0 ? (
        <EmptyState
          icon={<Briefcase className="h-6 w-6" />}
          title="No vendors match your filters"
          description="Try widening your price range or clearing a filter to see more vendors."
        />
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {vendors.map((vendor) => (
              <VendorCard key={vendor.id} vendor={vendor} favorited={favoriteIds.has(vendor.id)} />
            ))}
          </div>
          <VendorsPagination page={page} totalPages={totalPages} />
        </>
      )}
    </main>
  );
}
