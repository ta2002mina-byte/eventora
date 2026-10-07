import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, ArrowLeft, CalendarClock, Briefcase, Images } from "lucide-react";
import { getVendorBySlugOrId, getSimilarVendors, getFavoriteVendorIds } from "@/lib/data/vendors";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/Badge";
import { ShareButton } from "@/components/events/ShareButton";
import { VendorFavoriteButton } from "@/components/vendors/VendorFavoriteButton";
import { VendorServicesList, VendorPackagesList } from "@/components/vendors/VendorOfferings";
import { VendorPortfolioGrid } from "@/components/vendors/VendorPortfolioGrid";
import { AvailabilityCalendar } from "@/components/venues/AvailabilityCalendar";
import { QuoteRequestForm } from "@/components/vendors/QuoteRequestForm";
import { MessageVendorButton } from "@/components/vendors/MessageVendorButton";
import { VendorReviews } from "@/components/vendors/VendorReviews";
import { WriteReviewButton } from "@/components/reviews/WriteReviewButton";
import { canReview } from "@/lib/data/reviews";
import { SimilarVendors } from "@/components/vendors/SimilarVendors";
import {
  VENDOR_CATEGORY_LABELS,
  formatVendorExperience,
  formatVendorPrice,
  formatResponseTime,
} from "@/types/vendor";

interface PageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const vendor = await getVendorBySlugOrId(params.id);
  if (!vendor) return { title: "Vendor not found" };
  return {
    title: vendor.business_name,
    description: vendor.description?.slice(0, 155),
  };
}

export default async function VendorDetailPage({ params }: PageProps) {
  const vendor = await getVendorBySlugOrId(params.id);
  if (!vendor) notFound();

  const [user, similarVendors] = await Promise.all([
    getCurrentUser(),
    getSimilarVendors(vendor.category, vendor.id),
  ]);

  let favorited = false;
  const similarFavoriteIds = new Set<string>();

  if (user) {
    const supabase = createClient();
    const [{ data: fav }, favoriteIds] = await Promise.all([
      supabase
        .from("vendor_favorites")
        .select("id")
        .eq("user_id", user.id)
        .eq("vendor_id", vendor.id)
        .maybeSingle(),
      getFavoriteVendorIds(user.id),
    ]);
    favorited = !!fav;
    favoriteIds.forEach((id) => similarFavoriteIds.add(id));
  }

  const location = [vendor.address, vendor.city].filter(Boolean).join(", ");
  const responseTime = formatResponseTime(vendor.response_time_hours);

  const myVendorReview = user
    ? vendor.vendor_reviews.find((r) => r.user_id === user.id)
    : undefined;
  const vendorReviewEligible = user ? await canReview("vendor", vendor.id, user.id) : false;

  return (
    <main className="container-page py-10">
      <Link
        href="/vendors"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-charcoal-400 hover:text-purple-700"
      >
        <ArrowLeft className="h-4 w-4" /> Back to vendors
      </Link>

      {/* Cover: a styled band today — real photos arrive once vendors
          can upload images via Supabase Storage. */}
      <div className="relative flex h-56 items-center justify-center overflow-hidden rounded-card bg-gradient-to-br from-lavender-100 to-gold-100 sm:h-72">
        <span className="font-display text-3xl italic text-purple-700 sm:text-4xl">
          {vendor.business_name}
        </span>
        <VendorFavoriteButton
          vendorId={vendor.id}
          initialFavorited={favorited}
          className="absolute right-4 top-4"
        />
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_360px]">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="purple">{VENDOR_CATEGORY_LABELS[vendor.category]}</Badge>
            {vendor.rating_count > 0 && (
              <Badge variant="gold">
                {vendor.rating_avg.toFixed(1)} · {vendor.rating_count} review
                {vendor.rating_count === 1 ? "" : "s"}
              </Badge>
            )}
          </div>
          <h1 className="mt-3 text-3xl sm:text-4xl">{vendor.business_name}</h1>

          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-charcoal-600">
            {location && (
              <span className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-purple-600" />
                {location}
              </span>
            )}
            <span className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-purple-600" />
              {formatVendorExperience(vendor)}
            </span>
            {responseTime && (
              <span className="flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-purple-600" />
                {responseTime}
              </span>
            )}
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <ShareButton title={vendor.business_name} />
            <Link
              href={`/vendors/${vendor.slug}/portfolio`}
              className="inline-flex h-9 items-center gap-1.5 rounded-pill border border-purple-300 px-3 text-sm font-medium text-purple-700 hover:bg-purple-50"
            >
              <Images className="h-4 w-4" /> View full portfolio
            </Link>
          </div>

          {vendor.description && (
            <div className="mt-8">
              <h2 className="text-xl">About</h2>
              <p className="mt-3 whitespace-pre-line text-charcoal-600">{vendor.description}</p>
            </div>
          )}

          {vendor.service_area.length > 0 && (
            <div className="mt-8">
              <h2 className="text-xl">Service area</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {vendor.service_area.map((area) => (
                  <Badge key={area} variant="gray">
                    {area}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8">
            <h2 className="text-xl">Services</h2>
            <div className="mt-3">
              <VendorServicesList services={vendor.vendor_services} currency={vendor.currency} />
            </div>
          </div>

          <div className="mt-8">
            <h2 className="text-xl">Packages</h2>
            <div className="mt-3">
              <VendorPackagesList packages={vendor.vendor_packages} currency={vendor.currency} />
            </div>
          </div>

          <div className="mt-8">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-xl">Portfolio</h2>
              {vendor.vendor_portfolio.length > 6 && (
                <Link
                  href={`/vendors/${vendor.slug}/portfolio`}
                  className="text-sm font-medium text-purple-700 hover:underline"
                >
                  See all
                </Link>
              )}
            </div>
            <div className="mt-3">
              <VendorPortfolioGrid items={vendor.vendor_portfolio} limit={6} />
            </div>
          </div>

          <div className="mt-8">
            <h2 className="flex items-center gap-2 text-xl">
              <CalendarClock className="h-5 w-5 text-purple-600" /> Availability
            </h2>
            <div className="mt-4 rounded-card border border-border bg-white p-5">
              <AvailabilityCalendar days={vendor.vendor_availability} />
            </div>
          </div>

          <div className="mt-10">
            <h2 className="text-xl">Reviews</h2>
            <div className="mt-4">
              <VendorReviews
                reviews={vendor.vendor_reviews}
                ratingAvg={vendor.rating_avg}
                ratingCount={vendor.rating_count}
                action={
                  <WriteReviewButton
                    isAuthenticated={!!user}
                    eligible={vendorReviewEligible}
                    type="vendor"
                    targetId={vendor.id}
                    existingReview={myVendorReview}
                  />
                }
              />
            </div>
          </div>
        </div>

        <aside className="h-fit space-y-4 lg:sticky lg:top-24">
          <div className="rounded-card border border-border bg-white p-5 shadow-softer">
            <h2 className="text-base font-medium text-charcoal">Request a quote</h2>
            <p className="mt-1 text-sm text-charcoal-400">
              Starting from {formatVendorPrice(vendor)}
            </p>
            <div className="mt-4">
              <QuoteRequestForm
                vendorId={vendor.id}
                isAuthenticated={!!user}
                packages={vendor.vendor_packages}
              />
            </div>
          </div>
          <MessageVendorButton
            isAuthenticated={!!user}
            vendorId={vendor.id}
            ownerId={vendor.owner_id}
            businessName={vendor.business_name}
          />
        </aside>
      </div>

      <SimilarVendors vendors={similarVendors} favoriteIds={similarFavoriteIds} />
    </main>
  );
}
