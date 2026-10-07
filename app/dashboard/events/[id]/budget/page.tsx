import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { getCurrentUser } from "@/lib/auth";
import { getUserEventById, getLatestPlanForEvent } from "@/lib/data/planner";
import { getOrCreateEventBudget, getBudgetExpenses, getEventAssociatedVendors } from "@/lib/data/budget";
import { getBudgetTotals } from "@/types/budget";
import { EventSectionNav } from "@/components/planner/EventSectionNav";
import { BudgetOverview } from "@/components/budget/BudgetOverview";
import { BudgetCategoryChart } from "@/components/budget/BudgetCategoryChart";
import { BudgetExpenseList } from "@/components/budget/BudgetExpenseList";
import { TotalBudgetEditor } from "@/components/budget/TotalBudgetEditor";

interface PageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const user = await getCurrentUser();
  if (!user) return { title: "Budget" };
  const event = await getUserEventById(params.id, user.id);
  return { title: event ? `${event.title} — Budget` : "Budget" };
}

export default async function EventBudgetPage({ params }: PageProps) {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <main className="container-page py-16 text-center">
        <p className="text-charcoal-600">Sign in to manage this event&apos;s budget.</p>
        <Link href="/auth/login" className="mt-4 inline-block">
          <Button size="sm">Sign In</Button>
        </Link>
      </main>
    );
  }

  const event = await getUserEventById(params.id, user.id);
  if (!event) notFound();

  const [budget, expenses, vendors, latestPlan] = await Promise.all([
    getOrCreateEventBudget(event.id, event.budget),
    getBudgetExpenses(event.id),
    getEventAssociatedVendors(event.id),
    getLatestPlanForEvent(event.id),
  ]);

  const totals = getBudgetTotals(budget.total_amount, expenses);
  const showAiBudgetBanner = !!latestPlan && !latestPlan.budget_applied_at && latestPlan.result.budgetAllocation.length > 0;

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
          <h1 className="text-3xl font-medium">Budget</h1>
          <p className="mt-1 text-charcoal-400">Track planned versus actual spend, by category.</p>
        </div>
        <TotalBudgetEditor eventId={event.id} totalAmount={budget.total_amount} currency={budget.currency} />
      </div>

      <EventSectionNav eventId={event.id} active="budget" className="mt-6" />

      {showAiBudgetBanner && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-card border border-purple-100 bg-gradient-to-br from-purple-50/60 to-gold-50/40 p-5">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-purple-700" />
            <div>
              <p className="text-sm font-medium text-charcoal">The AI Planner already built a budget for this event</p>
              <p className="mt-1 text-sm text-charcoal-600">
                Review and add it to your planner — it&apos;ll appear here as categorized expenses.
              </p>
            </div>
          </div>
          <Link href={`/dashboard/events/${event.id}/ai-planner`}>
            <Button size="sm" variant="outline" rightIcon={<ArrowRight className="h-4 w-4" />}>
              Add AI Budget to Planner
            </Button>
          </Link>
        </div>
      )}

      <div className="mt-6">
        <BudgetOverview totals={totals} currency={budget.currency} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Expenses</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <BudgetExpenseList
              eventId={event.id}
              initialExpenses={expenses}
              vendors={vendors}
              currency={budget.currency}
            />
          </CardContent>
        </Card>
        <BudgetCategoryChart expenses={expenses} currency={budget.currency} />
      </div>
    </main>
  );
}
