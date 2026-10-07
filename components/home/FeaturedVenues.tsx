import Link from "next/link";
import { VenueCard } from "@/components/venues/VenueCard";
import { getFeaturedVenues } from "@/lib/data/home";

export async function FeaturedVenues() {
  const venues = await getFeaturedVenues();
  if (venues.length === 0) return null;
  return (
    <section className="py-16">
      <div className="container-page">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl">Featured venues</h2>
            <p className="mt-2 text-charcoal-400">Spaces our planners keep coming back to.</p>
          </div>
          <Link href="/venues" className="hidden text-sm font-medium text-purple-700 hover:underline sm:block">
            View all venues
          </Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {venues.map((venue) => (
            <VenueCard key={venue.id} venue={{ ...venue, amenities: venue.amenities ?? [] }} />
          ))}
        </div>
      </div>
    </section>
  );
}
