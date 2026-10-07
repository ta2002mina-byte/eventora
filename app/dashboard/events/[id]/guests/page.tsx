import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { getCurrentUser } from "@/lib/auth";
import { getUserEventById } from "@/lib/data/planner";
import { getEventGuests, getEventGuestTables } from "@/lib/data/guests";
import { EventSectionNav } from "@/components/planner/EventSectionNav";
import { GuestSummaryCards } from "@/components/guests/GuestSummaryCards";
import { GuestList } from "@/components/guests/GuestList";

interface PageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const user = await getCurrentUser();
  if (!user) return { title: "Guests" };
  const event = await getUserEventById(params.id, user.id);
  return { title: event ? `${event.title} — Guests` : "Guests" };
}

export default async function EventGuestsPage({ params }: PageProps) {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <main className="container-page py-16 text-center">
        <p className="text-charcoal-600">Sign in to manage this event&apos;s guest list.</p>
        <Link href="/auth/login" className="mt-4 inline-block">
          <Button size="sm">Sign In</Button>
        </Link>
      </main>
    );
  }

  const event = await getUserEventById(params.id, user.id);
  if (!event) notFound();

  const [guests, tables] = await Promise.all([getEventGuests(event.id), getEventGuestTables(event.id)]);

  return (
    <main className="container-page py-10 sm:py-14">
      <Link
        href={`/dashboard/events/${event.id}`}
        className="inline-flex items-center gap-1.5 text-sm text-charcoal-400 hover:text-purple-700"
      >
        <ArrowLeft className="h-4 w-4" /> {event.title}
      </Link>

      <div className="mt-3">
        <h1 className="text-3xl font-medium">Guests</h1>
        <p className="mt-1 text-charcoal-400">RSVPs, groups, meal preferences and seating.</p>
      </div>

      <EventSectionNav eventId={event.id} active="guests" className="mt-6" />

      <div className="mt-6">
        <GuestSummaryCards guests={guests} guestCountTarget={event.guest_count} />
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Guest list</CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
          <GuestList eventId={event.id} initialGuests={guests} initialTables={tables} />
        </CardContent>
      </Card>
    </main>
  );
}
