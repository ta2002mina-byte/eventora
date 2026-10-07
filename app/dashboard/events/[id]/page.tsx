import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Sparkles, ListChecks, ArrowRight, CalendarDays, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { getCurrentUser } from "@/lib/auth";
import {
  getUserEventById,
  getEventTasks,
  getEventBookingCounts,
  getEventProgress,
} from "@/lib/data/planner";
import { EventSummaryCards } from "@/components/planner/EventSummaryCards";
import { EventSectionNav } from "@/components/planner/EventSectionNav";
import { getEventGuests } from "@/lib/data/guests";
import { getOrCreateEventBudget, getBudgetExpenses } from "@/lib/data/budget";
import { getGuestSummary } from "@/types/guest";
import { getBudgetTotals } from "@/types/budget";

interface PageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const user = await getCurrentUser();
  if (!user) return { title: "Event" };
  const event = await getUserEventById(params.id, user.id);
  return { title: event?.title ?? "Event" };
}

export default async function EventOverviewPage({ params }: PageProps) {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <main className="container-page py-16 text-center">
        <p className="text-charcoal-600">Sign in to view this event.</p>
        <Link href="/auth/login" className="mt-4 inline-block">
          <Button size="sm">Sign In</Button>
        </Link>
      </main>
    );
  }

  const event = await getUserEventById(params.id, user.id);
  if (!event) notFound();

  const [tasks, bookingCounts, guests, budget, expenses] = await Promise.all([
    getEventTasks(event.id),
    getEventBookingCounts(event.id),
    getEventGuests(event.id),
    getOrCreateEventBudget(event.id, event.budget),
    getBudgetExpenses(event.id),
  ]);
  const progress = getEventProgress(event, tasks);
  const guestSummary = getGuestSummary(guests);
  const budgetTotals = getBudgetTotals(budget.total_amount, expenses);

  return (
    <main className="container-page py-10 sm:py-14">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="purple">{event.event_type ?? "Event"}</Badge>
            <Badge variant="gray">{event.status}</Badge>
          </div>
          <h1 className="mt-2 text-3xl font-medium">{event.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-charcoal-400">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4" /> {event.start_date}
            </span>
            {(event.city || event.location_name) && (
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" /> {event.location_name ?? event.city}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/dashboard/events/${event.id}/ai-planner`}>
            <Button variant="outline" leftIcon={<Sparkles className="h-4 w-4" />}>
              AI Planner
            </Button>
          </Link>
          <Link href={`/dashboard/events/${event.id}/planner`}>
            <Button leftIcon={<ListChecks className="h-4 w-4" />}>Open Planner</Button>
          </Link>
        </div>
      </div>

      <EventSectionNav eventId={event.id} active="overview" className="mt-6" />

      <Card className="mt-8">
        <CardContent className="p-5">
          <ProgressBar value={progress.percent} label="Planning progress" />
          <p className="mt-3 text-sm text-charcoal-400">
            {progress.tasksTotal > 0
              ? `${progress.tasksComplete} of ${progress.tasksTotal} tasks complete.`
              : "No tasks yet — generate a checklist with the AI Planner or add your own."}
          </p>
        </CardContent>
      </Card>

      <div className="mt-6">
        <EventSummaryCards
          event={event}
          bookingCounts={bookingCounts}
          guestSummary={guestSummary}
          budgetTotals={budgetTotals}
        />
      </div>

      {event.description && (
        <div className="mt-8">
          <h2 className="text-lg font-medium text-charcoal">About this event</h2>
          <p className="mt-2 max-w-2xl text-sm text-charcoal-600">{event.description}</p>
        </div>
      )}

      <div className="mt-10 rounded-card border border-dashed border-border bg-purple-50/30 p-6 text-center">
        <p className="text-sm text-charcoal-600">
          Haven&apos;t generated a plan yet? The AI Planner can build a budget, checklist, timeline
          and vendor/venue recommendations in seconds.
        </p>
        <Link
          href={`/dashboard/events/${event.id}/ai-planner`}
          className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-purple-700 hover:underline"
        >
          Open the AI Planner <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </main>
  );
}
