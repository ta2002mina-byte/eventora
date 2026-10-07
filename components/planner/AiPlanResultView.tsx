"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Wallet,
  ListChecks,
  CalendarClock,
  Building2,
  Store,
  Users,
  ClipboardCheck,
  Save,
  Search,
  Sparkles,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { applyPlanBudget, applyPlanTasks, savePlanAsEvent } from "@/app/ai-planner/actions";
import type { AiPlanResult } from "@/types/planner";

const priorityVariant = { essential: "purple", recommended: "gold", optional: "gray" } as const;

export function AiPlanResultView({
  plan,
  planId,
  eventId,
  isAuthenticated,
  saveDefaults,
}: {
  plan: AiPlanResult;
  planId: string | null;
  eventId: string | null;
  isAuthenticated: boolean;
  saveDefaults: {
    eventType: string;
    location?: string;
    guestCount?: number;
    budget?: number;
    eventDate?: string;
  };
}) {
  const { toast } = useToast();
  const router = useRouter();
  const [pending, setPending] = React.useState<null | "budget" | "tasks" | "save">(null);
  const [budgetApplied, setBudgetApplied] = React.useState(false);
  const [tasksApplied, setTasksApplied] = React.useState(false);

  const totalBudget = plan.budgetAllocation.reduce((sum, item) => sum + (item.amount || 0), 0);

  async function handleAddBudget() {
    if (!planId) return;
    setPending("budget");
    const result = await applyPlanBudget(planId);
    setPending(null);
    if (!result.ok) {
      toast({ variant: "error", title: "Couldn't add budget", description: result.error });
      return;
    }
    setBudgetApplied(true);
    toast({ variant: "success", title: "Budget added to your event" });
  }

  async function handleAddTasks() {
    if (!planId) return;
    setPending("tasks");
    const result = await applyPlanTasks(planId);
    setPending(null);
    if (!result.ok) {
      toast({ variant: "error", title: "Couldn't add tasks", description: result.error });
      return;
    }
    setTasksApplied(true);
    toast({ variant: "success", title: "Checklist added to your planner" });
  }

  async function handleSavePlan() {
    setPending("save");
    const title =
      saveDefaults.eventType && saveDefaults.location
        ? `${saveDefaults.eventType[0].toUpperCase()}${saveDefaults.eventType.slice(1)} in ${saveDefaults.location}`
        : `New ${saveDefaults.eventType || "event"}`;
    const result = await savePlanAsEvent({
      title,
      planId,
      eventType: saveDefaults.eventType,
      location: saveDefaults.location,
      guestCount: saveDefaults.guestCount,
      budget: saveDefaults.budget,
      eventDate: saveDefaults.eventDate,
    });
    setPending(null);
    if (!result.ok || !result.eventId) {
      toast({ variant: "error", title: "Couldn't save this plan", description: result.error });
      return;
    }
    toast({ variant: "success", title: "Plan saved as a new event" });
    router.push(`/dashboard/events/${result.eventId}/ai-planner`);
  }

  function goToVenues() {
    const params = new URLSearchParams();
    const rec = plan.venueRecommendations[0];
    if (rec?.criteria.city || saveDefaults.location) params.set("city", rec?.criteria.city ?? saveDefaults.location!);
    if (rec?.criteria.minCapacity || saveDefaults.guestCount)
      params.set("minCapacity", String(rec?.criteria.minCapacity ?? saveDefaults.guestCount));
    if (rec?.criteria.maxPrice) params.set("maxPrice", String(rec.criteria.maxPrice));
    router.push(`/venues${params.toString() ? `?${params}` : ""}`);
  }

  function goToVendors() {
    const params = new URLSearchParams();
    const rec = plan.vendorRecommendations[0];
    if (rec?.category) params.set("category", rec.category);
    if (rec?.criteria.city || saveDefaults.location) params.set("city", rec?.criteria.city ?? saveDefaults.location!);
    if (rec?.criteria.maxPrice) params.set("maxPrice", String(rec.criteria.maxPrice));
    router.push(`/vendors${params.toString() ? `?${params}` : ""}`);
  }

  return (
    <div className="space-y-6">
      <Card className="border-purple-100 bg-gradient-to-br from-purple-50/60 to-gold-50/40">
        <CardContent className="flex gap-3 p-5">
          <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-purple-700" />
          <div>
            <p className="text-sm font-medium text-charcoal">Your event plan</p>
            <p className="mt-1 text-sm text-charcoal-600">{plan.overview}</p>
          </div>
        </CardContent>
      </Card>

      {/* Action bar */}
      <div className="flex flex-wrap gap-2">
        {eventId ? (
          <>
            <Button
              size="sm"
              variant="outline"
              leftIcon={pending === "budget" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}
              disabled={pending !== null || budgetApplied || !planId}
              onClick={handleAddBudget}
            >
              {budgetApplied ? "Budget added" : "Add Budget"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              leftIcon={pending === "tasks" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ListChecks className="h-4 w-4" />}
              disabled={pending !== null || tasksApplied || !planId}
              onClick={handleAddTasks}
            >
              {tasksApplied ? "Tasks added" : "Add Tasks"}
            </Button>
          </>
        ) : isAuthenticated ? (
          <Button
            size="sm"
            leftIcon={pending === "save" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            disabled={pending !== null}
            onClick={handleSavePlan}
          >
            Save Plan
          </Button>
        ) : (
          <Link href="/auth/login">
            <Button size="sm" variant="outline" leftIcon={<Save className="h-4 w-4" />}>
              Sign in to Save Plan
            </Button>
          </Link>
        )}
        <Button size="sm" variant="secondary" leftIcon={<Building2 className="h-4 w-4" />} onClick={goToVenues}>
          Search Venues
        </Button>
        <Button size="sm" variant="secondary" leftIcon={<Store className="h-4 w-4" />} onClick={goToVendors}>
          Find Vendors
        </Button>
      </div>

      {/* Budget allocation */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Wallet className="h-4 w-4 text-purple-700" /> Budget allocation
            </CardTitle>
            <CardDescription>
              {totalBudget > 0 ? `≈ ${totalBudget.toLocaleString()} BDT total` : "Add a budget to see amounts"}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 pt-4">
          {plan.budgetAllocation.map((item) => (
            <div key={item.category}>
              <div className="flex items-center justify-between text-sm">
                <span className="text-charcoal">{item.category}</span>
                <span className="text-charcoal-400">
                  {item.percentage}%{item.amount ? ` · ${item.amount.toLocaleString()} BDT` : ""}
                </span>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-pill bg-lavender-100">
                <div
                  className="h-full rounded-pill bg-purple-600"
                  style={{ width: `${Math.min(100, item.percentage)}%` }}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Checklist */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardCheck className="h-4 w-4 text-purple-700" /> Planning checklist
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-2">
            {plan.checklist.map((item) => (
              <div key={item.title} className="rounded-lg border border-border p-3">
                <p className="text-sm font-medium text-charcoal">{item.title}</p>
                {item.description && <p className="mt-0.5 text-xs text-charcoal-400">{item.description}</p>}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarClock className="h-4 w-4 text-purple-700" /> Timeline
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-2">
            {plan.timeline.map((item) => (
              <div key={item.label} className="flex gap-3 rounded-lg border border-border p-3">
                <Badge variant="gray" className="h-fit shrink-0 whitespace-nowrap">
                  {item.dueDate ?? item.label}
                </Badge>
                <div>
                  <p className="text-sm font-medium text-charcoal">{item.title}</p>
                  {item.description && <p className="mt-0.5 text-xs text-charcoal-400">{item.description}</p>}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Venue requirements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-4 w-4 text-purple-700" /> Venue requirements
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-2">
            {plan.venueRequirements.map((row) => (
              <div key={row.label} className="flex justify-between gap-4 text-sm">
                <span className="text-charcoal-400">{row.label}</span>
                <span className="text-right text-charcoal">{row.value}</span>
              </div>
            ))}
            {plan.venueRecommendations.map((rec) => (
              <p key={rec.title} className="pt-2 text-xs text-charcoal-400">
                {rec.description}
              </p>
            ))}
          </CardContent>
        </Card>

        {/* Vendor categories */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Store className="h-4 w-4 text-purple-700" /> Vendor categories
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2 pt-2">
            {plan.vendorCategories.map((cat) => (
              <Badge key={cat.category} variant={priorityVariant[cat.priority]}>
                {cat.label} · {cat.priority}
              </Badge>
            ))}
          </CardContent>
        </Card>

        {/* Guest checklist */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4 text-purple-700" /> Guest checklist
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-2">
            {plan.guestChecklist.map((item) => (
              <p key={item.title} className="text-sm text-charcoal">
                • {item.title}
              </p>
            ))}
          </CardContent>
        </Card>

        {/* Important tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Search className="h-4 w-4 text-purple-700" /> Important tasks
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-2">
            {plan.importantTasks.map((item) => (
              <div key={item.title} className="rounded-lg border border-border p-3">
                <p className="text-sm font-medium text-charcoal">{item.title}</p>
                {item.description && <p className="mt-0.5 text-xs text-charcoal-400">{item.description}</p>}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
