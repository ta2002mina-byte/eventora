import Link from "next/link";
import { Wallet, Users, Building2, Store, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import type { EventRecord } from "@/types/event";
import type { EventBookingCounts } from "@/lib/data/planner";
import type { GuestSummary } from "@/types/guest";
import type { BudgetTotals } from "@/types/budget";

export function EventSummaryCards({
  event,
  bookingCounts,
  guestSummary,
  budgetTotals,
}: {
  event: EventRecord;
  bookingCounts: EventBookingCounts;
  guestSummary: GuestSummary;
  budgetTotals: BudgetTotals;
}) {
  const cards = [
    {
      icon: Wallet,
      label: "Budget",
      value:
        budgetTotals.totalBudget > 0
          ? `${budgetTotals.totalBudget.toLocaleString()} ${event.currency}`
          : "Not set",
      href: `/dashboard/events/${event.id}/budget`,
      hint:
        budgetTotals.totalBudget > 0
          ? `${budgetTotals.remaining.toLocaleString()} ${event.currency} remaining`
          : "Set up your budget",
    },
    {
      icon: Users,
      label: "Guests",
      value: guestSummary.total > 0 ? `${guestSummary.total} added` : "Not set",
      href: `/dashboard/events/${event.id}/guests`,
      hint: guestSummary.total > 0 ? `${guestSummary.confirmed} confirmed` : "Add your guest list",
    },
    {
      icon: Building2,
      label: "Venue requests",
      value: `${bookingCounts.venueBookings} sent`,
      href: "/venues",
      hint: "Browse venues",
    },
    {
      icon: Store,
      label: "Vendor requests",
      value: `${bookingCounts.vendorBookings} sent`,
      href: "/vendors",
      hint: "Browse vendors",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-charcoal-400">
              <card.icon className="h-4 w-4" />
              <span className="text-xs font-medium uppercase tracking-wide">{card.label}</span>
            </div>
            <p className="mt-2 text-lg font-medium text-charcoal">{card.value}</p>
            <Link
              href={card.href}
              className="mt-2 inline-flex items-center gap-1 text-xs text-purple-700 hover:underline"
            >
              {card.hint} <ArrowRight className="h-3 w-3" />
            </Link>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
