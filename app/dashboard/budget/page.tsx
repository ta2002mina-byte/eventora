import type { Metadata } from "next";
import Link from "next/link";
import { Wallet, ArrowRight, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StatCard } from "@/components/dashboard/StatCard";
import { getCurrentUser } from "@/lib/auth";
import { getUserEvents } from "@/lib/data/planner";
import { getBudgetsByEvent, aggregateBudget } from "@/lib/data/dashboard";

export const metadata: Metadata = { title: "Budget" };

export default async function DashboardBudgetPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const events = await getUserEvents(user.id);
  const groups = await getBudgetsByEvent(events);
  const totals = aggregateBudget(groups);
  const usedPercent = totals.totalBudget > 0 ? (totals.actual / totals.totalBudget) * 100 : 0;

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <div>
        <h2 className="text-2xl font-medium">Budget</h2>
        <p className="mt-1 text-sm text-charcoal-400">
          Spending across all of your events. Manage line items from each event&apos;s budget.
        </p>
      </div>

      {groups.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={<Wallet className="h-5 w-5" />}
            title="No budgets set up"
            description="Set a total budget and add expenses from an event's budget page to track spending."
            className="mb-2"
          />
          <div className="text-center">
            <Link href="/dashboard/events">
              <Button variant="outline" size="sm">
                Go to my events
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={Wallet} label="Total budget" value={totals.totalBudget.toLocaleString()} />
            <StatCard icon={TrendingUp} label="Spent" value={totals.actual.toLocaleString()} />
            <StatCard
              icon={Wallet}
              label="Remaining"
              value={totals.remaining.toLocaleString()}
              hint={`${Math.round(usedPercent)}% used`}
            />
            <StatCard
              icon={Wallet}
              label="Expenses"
              value={`${totals.paidCount + totals.unpaidCount}`}
              hint={`${totals.unpaidCount} unpaid`}
            />
          </div>

          <Card className="mt-6">
            <CardContent className="p-5">
              <ProgressBar value={usedPercent} label="Overall budget used" />
            </CardContent>
          </Card>

          <div className="mt-8 space-y-4">
            {groups.map((group) => {
              const percent =
                group.totals.totalBudget > 0
                  ? (group.totals.actual / group.totals.totalBudget) * 100
                  : 0;
              return (
                <Card key={group.event.id}>
                  <CardContent className="p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="font-medium text-charcoal">{group.event.title}</h3>
                        <p className="text-sm text-charcoal-400">
                          {group.totals.actual.toLocaleString()} of{" "}
                          {group.totals.totalBudget.toLocaleString()} {group.event.currency} spent
                        </p>
                      </div>
                      <Link href={`/dashboard/events/${group.event.id}/budget`}>
                        <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="h-4 w-4" />}>
                          Manage
                        </Button>
                      </Link>
                    </div>
                    <ProgressBar value={percent} className="mt-3" />
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </main>
  );
}
