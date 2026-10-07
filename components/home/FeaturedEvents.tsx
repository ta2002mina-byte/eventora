import Link from "next/link";
import { EventCard } from "@/components/events/EventCard";
import { getFeaturedEvents } from "@/lib/data/home";

export async function FeaturedEvents() {
  const events = await getFeaturedEvents();
  if (events.length === 0) return null;
  return (
    <section className="bg-white py-16">
      <div className="container-page">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl">Featured events</h2>
            <p className="mt-2 text-charcoal-400">Handpicked events happening soon.</p>
          </div>
          <Link href="/events" className="hidden text-sm font-medium text-purple-700 hover:underline sm:block">
            View all events
          </Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      </div>
    </section>
  );
}
