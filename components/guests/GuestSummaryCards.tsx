import { Users, UserCheck, Mail, UserX } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { getGuestSummary } from "@/types/guest";
import type { GuestRecord } from "@/types/guest";

export function GuestSummaryCards({ guests, guestCountTarget }: { guests: GuestRecord[]; guestCountTarget: number | null }) {
  const summary = getGuestSummary(guests);

  const cards = [
    {
      icon: Users,
      label: "Total guests",
      value: summary.total.toString(),
      hint: guestCountTarget ? `of ${guestCountTarget} planned` : "Add your first guest",
    },
    {
      icon: UserCheck,
      label: "Confirmed",
      value: summary.confirmed.toString(),
      hint: `${summary.headcount} incl. plus-ones`,
    },
    {
      icon: Mail,
      label: "Invited / Pending",
      value: `${summary.invited} / ${summary.pending}`,
      hint: "Awaiting a response",
    },
    {
      icon: UserX,
      label: "Declined",
      value: summary.declined.toString(),
      hint: "Won't attend",
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
            <p className="mt-1 text-xs text-charcoal-400">{card.hint}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
