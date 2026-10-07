import type { Metadata } from "next";
import Link from "next/link";
import { Ticket as TicketIcon, CalendarDays, MapPin, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { getCurrentUser } from "@/lib/auth";
import { getUserTickets } from "@/lib/data/booking";
import type { TicketStatus } from "@/types/booking";

export const metadata: Metadata = { title: "My Tickets" };

const statusVariant: Record<TicketStatus, "success" | "gray" | "danger"> = {
  valid: "success",
  used: "gray",
  cancelled: "danger",
};

function formatDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default async function TicketsPage() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <main className="container-page py-16 text-center">
        <p className="text-charcoal-600">Sign in to view your tickets.</p>
        <Link href="/auth/login" className="mt-4 inline-block">
          <Button size="sm">Sign In</Button>
        </Link>
      </main>
    );
  }

  const tickets = await getUserTickets(user.id);

  return (
    <main className="container-page py-10 sm:py-14">
      <h1 className="text-3xl font-medium">My Tickets</h1>
      <p className="mt-1 text-charcoal-400">Digital tickets for events you&apos;ve booked.</p>

      {tickets.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={<TicketIcon className="h-5 w-5" />}
            title="No tickets yet"
            description="Get tickets to an event and they'll show up here."
          />
          <div className="mt-4 text-center">
            <Link href="/events">
              <Button size="sm">Browse Events</Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tickets.map((ticket) => (
            <Link key={ticket.id} href={`/tickets/${ticket.id}`}>
              <Card className="h-full transition-shadow hover:shadow-soft">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <Badge variant="purple">{ticket.ticket_type_name}</Badge>
                    <Badge variant={statusVariant[ticket.status]}>{ticket.status}</Badge>
                  </div>
                  <p className="mt-3 truncate font-medium text-charcoal">{ticket.event.title}</p>
                  <div className="mt-2 space-y-1 text-sm text-charcoal-400">
                    <span className="flex items-center gap-1.5">
                      <CalendarDays className="h-3.5 w-3.5" /> {formatDate(ticket.event.start_date)}
                    </span>
                    {(ticket.event.location_name || ticket.event.city) && (
                      <span className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" /> {ticket.event.location_name ?? ticket.event.city}
                      </span>
                    )}
                  </div>
                  <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-purple-700">
                    View ticket <ArrowRight className="h-3 w-3" />
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
