import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, Users, ArrowLeft, CalendarClock, ShieldCheck } from "lucide-react";
import { getVenueBySlugOrId, getSimilarVenues, getFavoriteVenueIds } from "@/lib/data/venues";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/Badge";
import { ShareButton } from "@/components/events/ShareButton";
import { VenueFavoriteButton } from "@/components/venues/VenueFavoriteButton";
import { AvailabilityCalendar } from "@/components/venues/AvailabilityCalendar";
import { BookingRequestForm } from "@/components/venues/BookingRequestForm";
import { MessageVenueButton } from "@/components/venues/MessageVenueButton";
import { VenueReviews } from "@/components/venues/VenueReviews";
import { WriteReviewButton } from "@/components/reviews/WriteReviewButton";
import { SimilarVenues } from "@/components/venues/SimilarVenues";
import { canReview } from "@/lib/data/reviews";
import { VENUE_TYPE_LABELS, formatCapacity, formatVenuePrice } from "@/types/venue";

interface PageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const venue = await getVenueBySlugOrId(params.id);
  if (!venue) return { title: "Venue not found" };
  return {
    title: venue.name,
    description: venue.description?.slice(0, 155),
  };
}

export default async function VenueDetailPage({ params }: PageProps) {
  const venue = await getVenueBySlugOrId(params.id);
  if (!venue) notFound();

  const [user, similarVenues] = await Promise.all([
    getCurrentUser(),
    getSimilarVenues(venue.venue_type, venue.id),
  ]);

  let favorited = false;
  const similarFavoriteIds = new Set<string>();

  if (user) {
    const supabase = createClient();
    const [{ data: fav }, favoriteIds] = await Promise.all([
      supabase
        .from("venue_favorites")
        .select("id")
        .eq("user_id", user.id)
        .eq("venue_id", venue.id)
        .maybeSingle(),
      getFavoriteVenueIds(user.id),
    ]);
    favorited = !!fav;
    favoriteIds.forEach((id) => similarFavoriteIds.add(id));
  }

  const location = [venue.address, venue.city].filter(Boolean).join(", ");

  const myVenueReview = user ? venue.venue_reviews.find((r) => r.user_id === user.id) : undefined;
  const venueReviewEligible = user ? await canReview("venue", venue.id, user.id) : false;

  return (
    <main className="container-page py-10">
      <Link
        href="/venues"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-charcoal-400 hover:text-purple-700"
      >
        <ArrowLeft className="h-4 w-4" /> Back to venues
      </Link>

      {/* Gallery: a styled band today — real photos arrive once venue
          owners can upload images via Supabase Storage. */}
      <div className="relative flex h-56 items-center justify-center overflow-hidden rounded-card bg-gradient-to-br from-gold-100 to-lavender-100 sm:h-72">
        <span className="font-display text-3xl italic text-purple-700 sm:text-4xl">
          {venue.name}
        </span>
        <VenueFavoriteButton
          venueId={venue.id}
          initialFavorited={favorited}
          className="absolute right-4 top-4"
        />
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_360px]">
        <div>
          <Badge variant="purple">{VENUE_TYPE_LABELS[venue.venue_type]}</Badge>
          <h1 className="mt-3 text-3xl sm:text-4xl">{venue.name}</h1>

          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-charcoal-600">
            {location && (
              <span className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-purple-600" />
                {location}
              </span>
            )}
            <span className="flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-600" />
              {formatCapacity(venue)}
            </span>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <ShareButton title={venue.name} />
          </div>

          {venue.description && (
            <div className="mt-8">
              <h2 className="text-xl">About this venue</h2>
              <p className="mt-3 whitespace-pre-line text-charcoal-600">{venue.description}</p>
            </div>
          )}

          {venue.amenities.length > 0 && (
            <div className="mt-8">
              <h2 className="text-xl">Amenities</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {venue.amenities.map((a) => (
                  <Badge key={a} variant="gray">
                    {a}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {venue.rules && (
            <div className="mt-8">
              <h2 className="flex items-center gap-2 text-xl">
                <ShieldCheck className="h-5 w-5 text-purple-600" /> Venue rules
              </h2>
              <p className="mt-3 whitespace-pre-line text-charcoal-600">{venue.rules}</p>
            </div>
          )}

          <div className="mt-8">
            <h2 className="flex items-center gap-2 text-xl">
              <CalendarClock className="h-5 w-5 text-purple-600" /> Availability
            </h2>
            <div className="mt-4 rounded-card border border-border bg-white p-5">
              <AvailabilityCalendar days={venue.venue_availability} />
            </div>
          </div>

          {location && (
            <div className="mt-8">
              <h2 className="text-xl">Location</h2>
              <div className="mt-3 flex h-40 items-center justify-center rounded-card border border-border bg-purple-50/40 text-sm text-charcoal-400">
                <span className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" /> {location}
                </span>
              </div>
            </div>
          )}

          <div className="mt-10">
            <h2 className="text-xl">Reviews</h2>
            <div className="mt-4">
              <VenueReviews
                reviews={venue.venue_reviews}
                ratingAvg={venue.rating_avg}
                ratingCount={venue.rating_count}
                action={
                  <WriteReviewButton
                    isAuthenticated={!!user}
                    eligible={venueReviewEligible}
                    type="venue"
                    targetId={venue.id}
                    existingReview={myVenueReview}
                  />
                }
              />
            </div>
          </div>
        </div>

        <aside className="h-fit rounded-card border border-border bg-white p-5 shadow-softer lg:sticky lg:top-24">
          <h2 className="text-base font-medium text-charcoal">Request a booking</h2>
          <p className="mt-1 text-sm text-charcoal-400">
            Starting from {formatVenuePrice(venue)}
          </p>
          <div className="mt-4">
            <BookingRequestForm
              venueId={venue.id}
              isAuthenticated={!!user}
              maxCapacity={venue.capacity_max}
            />
          </div>
          <div className="mt-3">
            <MessageVenueButton
              isAuthenticated={!!user}
              venueId={venue.id}
              ownerId={venue.owner_id}
              venueName={venue.name}
            />
          </div>
        </aside>
      </div>

      <SimilarVenues venues={similarVenues} favoriteIds={similarFavoriteIds} />
    </main>
  );
}
