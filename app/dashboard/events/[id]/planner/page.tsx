import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
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
import { EventTaskList } from "@/components/planner/EventTaskList";
import { getEventGuests } from "@/lib/data/guests";
import { getOrCreateEventBudget, getBudgetExpenses } from "@/lib/data/budget";
import { getGuestSummary } from "@/types/guest";
import { getBudgetTotals } from "@/types/budget";

interface PageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const user = await getCurrentUser();
  if (!user) return { title: "Planner" };
  const event = await getUserEventById(params.id, user.id);
  return { title: event ? `${event.title} — Planner` : "Planner" };
}

export default async function EventPlannerPage({ params }: PageProps) {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <main className="container-page py-16 text-center">
        <p className="text-charcoal-600">Sign in to view this event&apos;s planner.</p>
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
      <Link
        href={`/dashboard/events/${event.id}`}
        className="inline-flex items-center gap-1.5 text-sm text-charcoal-400 hover:text-purple-700"
      >
        <ArrowLeft className="h-4 w-4" /> {event.title}
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-medium">Planner</h1>
              <p className="mt-1 text-charcoal-400">Overview, tasks and timeline for this event.</p>
        </div>
        <Link href={`/dashboard/events/${event.id}/ai-planner`}>
          <Button variant="outline" leftIcon={<Sparkles className="h-4 w-4" />}>
            Generate with AI
          </Button>
        </Link>
      </div>

      <EventSectionNav eventId={event.id} active="planner" className="mt-6" />

      <Card className="mt-6">
        <CardContent className="p-5">
          <ProgressBar value={progress.percent} label="Planning progress" />
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

      <div className="mt-8 grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Tasks</CardTitle>
            <Badge variant="gray">
              {progress.tasksComplete}/{progress.tasksTotal} done
            </Badge>
          </CardHeader>
          <CardContent className="pt-2">
            <EventTaskList eventId={event.id} initialTasks={tasks} />
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Guest summary</CardTitle>
              <Badge variant="gray">{guestSummary.total}</Badge>
            </CardHeader>
            <CardContent className="pt-2">
              <p className="text-sm text-charcoal-600">
                {guestSummary.total > 0
                  ? `${guestSummary.confirmed} confirmed, ${guestSummary.invited} invited, ${guestSummary.pending} pending.`
                  : "No guests added yet."}
              </p>
              <Link
                href={`/dashboard/events/${event.id}/guests`}
                className="mt-2 inline-block text-xs font-medium text-purple-700 hover:underline"
              >
                Manage guests →
              </Link>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Budget summary</CardTitle>
              <Badge variant="gray">{expenses.length} expenses</Badge>
            </CardHeader>
            <CardContent className="pt-2">
              <p className="text-sm text-charcoal-600">
                {budgetTotals.totalBudget
                  ? `${budgetTotals.totalBudget.toLocaleString()} ${budget.currency} total, ${budgetTotals.remaining.toLocaleString()} ${budget.currency} remaining.`
                  : "No budget set yet."}
              </p>
              <Link
                href={`/dashboard/events/${event.id}/budget`}
                className="mt-2 inline-block text-xs font-medium text-purple-700 hover:underline"
              >
                Manage budget →
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
