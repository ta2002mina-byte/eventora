import type { Metadata } from "next";
import Link from "next/link";
import {
  CalendarDays,
  ListChecks,
  Users,
  Wallet,
  ClipboardList,
  Heart,
  Sparkles,
  ArrowRight,
  MapPin,
  MessageSquare,
  Building2,
  Store,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatCard } from "@/components/dashboard/StatCard";
import { getCurrentUser } from "@/lib/auth";
import { getDashboardOverview } from "@/lib/data/dashboard";

export const metadata: Metadata = { title: "Dashboard" };

const bookingStatusVariant = {
  pending: "warning",
  confirmed: "success",
  cancelled: "danger",
  completed: "purple",
} as const;

const savedKindIcon = {
  event: CalendarDays,
  venue: Building2,
  vendor: Store,
} as const;

function formatDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null; // layout renders the sign-in gate

  const overview = await getDashboardOverview(user.id);
  const {
    events,
    upcoming,
    taskStats,
    rsvp,
    budget,
    bookings,
    recentBookings,
    savedCount,
    savedPreview,
    activity,
  } = overview;

  const taskPercent = taskStats.total > 0 ? (taskStats.complete / taskStats.total) * 100 : 0;
  const budgetPercent = budget.totalBudget > 0 ? (budget.actual / budget.totalBudget) * 100 : 0;

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-charcoal-400">Welcome back</p>
          <h2 className="text-2xl font-medium">Here&apos;s your event overview</h2>
        </div>
        <Link href="/dashboard/events">
          <Button variant="outline" size="sm" rightIcon={<ArrowRight className="h-4 w-4" />}>
            View all events
          </Button>
        </Link>
      </div>

      {/* AI Planner — prominent feature */}
      <Card className="mt-6 overflow-hidden border-purple-100 bg-gradient-to-r from-purple-700 to-purple-900 text-warmwhite">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 p-6">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-warmwhite/15">
              <Sparkles className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-lg font-medium text-warmwhite">AI Event Planner</h3>
              <p className="mt-1 max-w-md text-sm text-lavender-100">
                Tell Eventora your event type, guest count and budget — get a personalized plan with
                budget, checklist, timeline and vendor recommendations.
              </p>
            </div>
          </div>
          <Link href="/ai-planner">
            <Button className="bg-warmwhite text-purple-800 hover:bg-lavender-100">
              Plan with AI
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Summary stats */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          icon={CalendarDays}
          label="My Events"
          value={String(events.length)}
          hint={upcoming.length > 0 ? `${upcoming.length} upcoming` : "View events"}
          href="/dashboard/events"
        />
        <StatCard
          icon={ListChecks}
          label="Tasks"
          value={taskStats.total > 0 ? `${taskStats.complete}/${taskStats.total}` : "0"}
          hint={taskStats.total > 0 ? `${Math.round(taskPercent)}% complete` : "No tasks yet"}
        />
        <StatCard
          icon={Users}
          label="Guests confirmed"
          value={rsvp.total > 0 ? `${rsvp.confirmed}/${rsvp.total}` : "0"}
          hint="Manage guests"
          href="/dashboard/guests"
        />
        <StatCard
          icon={Wallet}
          label="Budget spent"
          value={
            budget.totalBudget > 0
              ? budget.actual.toLocaleString()
              : "Not set"
          }
          hint={budget.totalBudget > 0 ? `of ${budget.totalBudget.toLocaleString()}` : "Set a budget"}
          href="/dashboard/budget"
        />
        <StatCard
          icon={ClipboardList}
          label="Bookings"
          value={String(bookings.total)}
          hint={bookings.pending > 0 ? `${bookings.pending} pending` : "View bookings"}
          href="/dashboard/bookings"
        />
        <StatCard
          icon={Heart}
          label="Saved"
          value={String(savedCount)}
          hint="View saved items"
          href="/dashboard/saved"
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {/* Upcoming events */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Upcoming events</h3>
            <Link
              href="/dashboard/events"
              className="text-sm text-purple-700 hover:underline"
            >
              See all
            </Link>
          </div>
          {upcoming.length === 0 ? (
            <EmptyState
              className="mt-4"
              icon={<CalendarDays className="h-5 w-5" />}
              title="No upcoming events"
              description="Create your first event or plan one with AI to see it here."
            />
          ) : (
            <div className="mt-4 space-y-3">
              {upcoming.map((event) => (
                <Card key={event.id} hoverable>
                  <Link href={`/dashboard/events/${event.id}`} className="block">
                    <CardContent className="flex items-center justify-between gap-4 p-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate font-medium text-charcoal">{event.title}</p>
                          <Badge variant="gray">{event.status}</Badge>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-charcoal-400">
                          <span className="flex items-center gap-1.5">
                            <CalendarDays className="h-4 w-4" /> {formatDate(event.start_date)}
                          </span>
                          {(event.location_name || event.city) && (
                            <span className="flex items-center gap-1.5">
                              <MapPin className="h-4 w-4" /> {event.location_name ?? event.city}
                            </span>
                          )}
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 shrink-0 text-purple-700" />
                    </CardContent>
                  </Link>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Progress + activity */}
        <div className="space-y-6">
          <Card>
            <CardContent className="p-5">
              <h3 className="text-base font-medium">Progress</h3>
              <div className="mt-4 space-y-4">
                <ProgressBar value={taskPercent} label="Tasks complete" />
                <ProgressBar value={budgetPercent} label="Budget used" />
                <div>
                  <div className="mb-1.5 flex items-center justify-between text-xs text-charcoal-600">
                    <span>RSVP confirmed</span>
                    <span>
                      {rsvp.confirmed}/{rsvp.total || 0}
                    </span>
                  </div>
                  <ProgressBar
                    value={rsvp.total > 0 ? (rsvp.confirmed / rsvp.total) * 100 : 0}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <h3 className="text-base font-medium">Recent activity</h3>
              {activity.length === 0 ? (
                <p className="mt-3 text-sm text-charcoal-400">No activity yet.</p>
              ) : (
                <ul className="mt-3 space-y-3">
                  {activity.map((item) => (
                    <li key={item.id} className="text-sm">
                      <Link href={item.href} className="text-charcoal-600 hover:text-purple-700">
                        {item.label}
                      </Link>
                      <p className="text-xs text-charcoal-400">{formatDate(item.date)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bookings / Saved / Messages summaries */}
      <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-medium">Booking summary</h3>
              <Link href="/dashboard/bookings" className="text-sm text-purple-700 hover:underline">
                See all
              </Link>
            </div>
            {recentBookings.length === 0 ? (
              <p className="mt-3 text-sm text-charcoal-400">
                No bookings yet. Request a venue or vendor to get started.
              </p>
            ) : (
              <>
                <p className="mt-1 text-xs text-charcoal-400">
                  {bookings.pending} pending · {bookings.confirmed} confirmed
                </p>
                <ul className="mt-3 space-y-3">
                  {recentBookings.map((b) => (
                    <li key={b.id} className="flex items-start justify-between gap-3 text-sm">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-charcoal">{b.targetName}</p>
                        <p className="truncate text-xs text-charcoal-400">
                          {b.eventName} · {formatDate(b.eventDate)}
                        </p>
                      </div>
                      <Badge
                        variant={
                          bookingStatusVariant[b.status as keyof typeof bookingStatusVariant] ??
                          "gray"
                        }
                      >
                        {b.status}
                      </Badge>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-medium">Saved items</h3>
              <Link href="/dashboard/saved" className="text-sm text-purple-700 hover:underline">
                See all
              </Link>
            </div>
            {savedPreview.length === 0 ? (
              <p className="mt-3 text-sm text-charcoal-400">
                Nothing saved yet. Tap the heart on events, venues or vendors to save them.
              </p>
            ) : (
              <ul className="mt-3 space-y-3">
                {savedPreview.map((item) => {
                  const Icon = savedKindIcon[item.kind];
                  return (
                    <li key={`${item.kind}-${item.id}`}>
                      <Link
                        href={item.href}
                        className="flex items-center gap-3 text-sm text-charcoal-600 hover:text-purple-700"
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-lavender-100 text-purple-700">
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate font-medium">{item.title}</span>
                          {item.subtitle && (
                            <span className="block truncate text-xs capitalize text-charcoal-400">
                              {item.subtitle}
                            </span>
                          )}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-medium">Messages</h3>
              <Link href="/dashboard/messages" className="text-sm text-purple-700 hover:underline">
                Open inbox
              </Link>
            </div>
            <div className="mt-3 flex items-start gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-lavender-100 text-purple-700">
                <MessageSquare className="h-4 w-4" />
              </span>
              <p className="text-sm text-charcoal-400">
                No new messages. Conversations with venues and vendors will appear here.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
