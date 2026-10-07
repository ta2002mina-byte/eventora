import type { Metadata } from "next";
import { CalendarX } from "lucide-react";
import { getEventCategories, getEvents, getFavoriteEventIds } from "@/lib/data/events";
import { getCurrentUser } from "@/lib/auth";
import { EventFilters } from "@/components/events/EventFilters";
import { EventCard } from "@/components/events/EventCard";
import { EventsPagination } from "@/components/events/EventsPagination";
import { EmptyState } from "@/components/ui/EmptyState";
import type { EventSortOption } from "@/types/event";

export const metadata: Metadata = { title: "Events" };

const ALLOWED_SORTS: EventSortOption[] = ["date_asc", "newest", "price_asc", "price_desc"];

export default async function EventsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) {
  const page = Number(searchParams.page ?? "1") || 1;
  const sort = ALLOWED_SORTS.includes(searchParams.sort as EventSortOption)
    ? (searchParams.sort as EventSortOption)
    : "date_asc";

  const [categories, user] = await Promise.all([getEventCategories(), getCurrentUser()]);

  const { events, count, pageSize } = await getEvents({
    q: searchParams.q,
    category: searchParams.category,
    city: searchParams.city,
    dateFrom: searchParams.dateFrom,
    minPrice: searchParams.minPrice ? Number(searchParams.minPrice) : undefined,
    maxPrice: searchParams.maxPrice ? Number(searchParams.maxPrice) : undefined,
    sort,
    page,
  });

  const favoriteIds = user ? await getFavoriteEventIds(user.id) : new Set<string>();
  const totalPages = Math.max(1, Math.ceil(count / pageSize));

  return (
    <main className="container-page py-10">
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl">Events</h1>
        <p className="mt-2 text-charcoal-400">
          {count > 0
            ? `${count} event${count === 1 ? "" : "s"} to explore`
            : "Discover weddings, corporate events, concerts and more."}
        </p>
      </div>

      <EventFilters categories={categories} />

      {events.length === 0 ? (
        <EmptyState
          icon={<CalendarX className="h-6 w-6" />}
          title="No events match your filters"
          description="Try widening your date range or clearing a filter to see more events."
        />
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <EventCard key={event.id} event={event} favorited={favoriteIds.has(event.id)} />
            ))}
          </div>
          <EventsPagination page={page} totalPages={totalPages} />
        </>
      )}
    </main>
  );
}
