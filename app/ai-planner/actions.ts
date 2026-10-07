"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { getAiProvider } from "@/services/ai";
import { slugify } from "@/lib/utils";
import type { AiPlanInput, AiPlanResult, GeneratePlanResult } from "@/types/planner";

const planInputSchema = z.object({
  eventType: z.string().min(1, "Choose an event type"),
  location: z.string().trim().max(120).optional().or(z.literal("")),
  guestCount: z.coerce.number().int().min(1).max(50000).optional(),
  budget: z.coerce.number().min(0).optional(),
  eventDate: z.string().optional().or(z.literal("")),
  theme: z.string().trim().max(120).optional().or(z.literal("")),
  venuePreference: z.string().trim().max(200).optional().or(z.literal("")),
  requirements: z.string().trim().max(1000).optional().or(z.literal("")),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
  eventId: z.string().uuid().optional(),
});

export type PlanFormInput = z.infer<typeof planInputSchema>;

/** Stable, no-suffix slug for a budget category label (distinct from the
 * random-suffixed `slugify` used for event URLs). */
function categorySlug(value: string) {
  return (
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/(^_|_$)/g, "")
      .slice(0, 60) || "other"
  );
}

async function assertOwnsEvent(eventId: string, userId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("events")
    .select("id")
    .eq("id", eventId)
    .eq("organizer_id", userId)
    .maybeSingle();
  return !!data;
}

async function persistItems(planId: string, result: AiPlanResult) {
  const supabase = createClient();
  const rows: Record<string, unknown>[] = [];

  result.budgetAllocation.forEach((item, i) =>
    rows.push({
      plan_id: planId,
      category: "budget",
      title: item.category,
      description: item.notes ?? null,
      amount: item.amount || null,
      percentage: item.percentage,
      sort_order: i,
    })
  );
  result.checklist.forEach((item, i) =>
    rows.push({
      plan_id: planId,
      category: "checklist",
      title: item.title,
      description: item.description ?? null,
      sort_order: i,
    })
  );
  result.timeline.forEach((item, i) =>
    rows.push({
      plan_id: planId,
      category: "timeline",
      title: item.title,
      description: item.description ?? null,
      due_date: item.dueDate ?? null,
      sort_order: i,
    })
  );
  result.guestChecklist.forEach((item, i) =>
    rows.push({
      plan_id: planId,
      category: "guest_checklist",
      title: item.title,
      description: item.description ?? null,
      sort_order: i,
    })
  );
  result.importantTasks.forEach((item, i) =>
    rows.push({
      plan_id: planId,
      category: "task",
      title: item.title,
      description: item.description ?? null,
      sort_order: i,
    })
  );

  if (rows.length) {
    const { error } = await supabase.from("ai_plan_items").insert(rows);
    if (error) console.error("persistItems (ai_plan_items):", error.message);
  }

  const recRows: Record<string, unknown>[] = [
    ...result.venueRecommendations.map((r, i) => ({
      plan_id: planId,
      kind: "venue",
      category: "venue",
      title: r.title,
      description: r.description,
      criteria: r.criteria,
      sort_order: i,
    })),
    ...result.vendorRecommendations.map((r, i) => ({
      plan_id: planId,
      kind: "vendor",
      category: r.category,
      title: r.title,
      description: r.description,
      criteria: r.criteria,
      sort_order: i,
    })),
  ];

  if (recRows.length) {
    const { error } = await supabase.from("ai_recommendations").insert(recRows);
    if (error) console.error("persistItems (ai_recommendations):", error.message);
  }
}

/**
 * Generates a structured event plan. Works for signed-out visitors too
 * (so the /ai-planner marketing flow always works) — in that case the
 * plan is returned but never written to the database (planId: null).
 */
export async function generatePlan(input: PlanFormInput): Promise<GeneratePlanResult> {
  const parsed = planInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const values = parsed.data;
  const aiInput: AiPlanInput = {
    eventType: values.eventType,
    location: values.location || undefined,
    guestCount: values.guestCount,
    budget: values.budget,
    eventDate: values.eventDate || undefined,
    theme: values.theme || undefined,
    venuePreference: values.venuePreference || undefined,
    requirements: values.requirements || undefined,
    notes: values.notes || undefined,
  };

  let result: AiPlanResult;
  try {
    result = await getAiProvider().generatePlan(aiInput);
  } catch (err) {
    console.error("generatePlan:", err);
    return { ok: false, error: "The AI Planner couldn't generate a plan. Please try again." };
  }

  const user = await getCurrentUser();
  if (!user) {
    return { ok: true, plan: result, planId: null };
  }

  if (values.eventId && !(await assertOwnsEvent(values.eventId, user.id))) {
    return { ok: false, error: "You don't have access to this event." };
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("ai_event_plans")
    .insert({
      user_id: user.id,
      event_id: values.eventId ?? null,
      event_type: values.eventType,
      location: values.location || null,
      guest_count: values.guestCount ?? null,
      budget: typeof values.budget === "number" ? values.budget : null,
      event_date: values.eventDate || null,
      theme: values.theme || null,
      venue_preference: values.venuePreference || null,
      requirements: values.requirements || null,
      notes: values.notes || null,
      provider: getAiProvider().name,
      overview: result.overview,
      result,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("generatePlan (insert):", error?.message);
    // Still return the generated plan even if persistence failed.
    return { ok: true, plan: result, planId: null };
  }

  await persistItems(data.id as string, result);

  if (values.eventId) {
    revalidatePath(`/dashboard/events/${values.eventId}/ai-planner`);
  }

  return { ok: true, plan: result, planId: data.id as string };
}

interface ActionResult {
  ok: boolean;
  error?: string;
}

/** Applies the plan's total budget allocation to the linked event. */
export async function applyPlanBudget(planId: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Sign in to apply this to your event." };

  const supabase = createClient();
  const { data: plan, error } = await supabase
    .from("ai_event_plans")
    .select("id, event_id, user_id, result, budget_applied_at")
    .eq("id", planId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !plan) return { ok: false, error: "Plan not found." };
  if (!plan.event_id) return { ok: false, error: "Save this plan to an event first." };
  if (plan.budget_applied_at) return { ok: true }; // already applied — no-op

  const result = plan.result as AiPlanResult;
  const total = result.budgetAllocation.reduce((sum, item) => sum + (item.amount || 0), 0);

  const { error: updateError } = await supabase
    .from("events")
    .update({ budget: total || null, updated_at: new Date().toISOString() })
    .eq("id", plan.event_id)
    .eq("organizer_id", user.id);

  if (updateError) return { ok: false, error: updateError.message };

  // Phase 07: also seed the real Budget page — a total row plus one
  // category expense per allocation line, so "Add Budget" here shows up
  // as planned amounts on /dashboard/events/[id]/budget.
  await supabase
    .from("event_budget")
    .upsert(
      { event_id: plan.event_id, total_amount: total || 0, updated_at: new Date().toISOString() },
      { onConflict: "event_id" }
    );

  if (result.budgetAllocation.length) {
    const expenseRows = result.budgetAllocation.map((item, i) => ({
      event_id: plan.event_id,
      category: categorySlug(item.category),
      title: item.category,
      planned_amount: item.amount || 0,
      actual_amount: 0,
      is_paid: false,
      notes: item.notes ?? null,
      source: "ai" as const,
      sort_order: i,
    }));
    const { error: expenseError } = await supabase.from("budget_expenses").insert(expenseRows);
    if (expenseError) console.error("applyPlanBudget (budget_expenses):", expenseError.message);
  }

  await supabase
    .from("ai_event_plans")
    .update({ budget_applied_at: new Date().toISOString() })
    .eq("id", planId);
  await supabase.from("ai_plan_items").update({ applied: true }).eq("plan_id", planId).eq("category", "budget");

  revalidatePath(`/dashboard/events/${plan.event_id}`);
  revalidatePath(`/dashboard/events/${plan.event_id}/planner`);
  revalidatePath(`/dashboard/events/${plan.event_id}/ai-planner`);
  revalidatePath(`/dashboard/events/${plan.event_id}/budget`);
  return { ok: true };
}

/** Adds the plan's checklist + important tasks to the event's task list. */
export async function applyPlanTasks(planId: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Sign in to apply this to your event." };

  const supabase = createClient();
  const { data: plan, error } = await supabase
    .from("ai_event_plans")
    .select("id, event_id, user_id, result, tasks_applied_at")
    .eq("id", planId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !plan) return { ok: false, error: "Plan not found." };
  if (!plan.event_id) return { ok: false, error: "Save this plan to an event first." };
  if (plan.tasks_applied_at) return { ok: true }; // already applied — no-op

  const result = plan.result as AiPlanResult;
  const rows = [...result.checklist, ...result.importantTasks].map((item, i) => ({
    event_id: plan.event_id,
    title: item.title,
    notes: item.description ?? null,
    priority: "medium" as const,
    source: "ai" as const,
    sort_order: i,
  }));

  if (rows.length) {
    const { error: insertError } = await supabase.from("event_tasks").insert(rows);
    if (insertError) return { ok: false, error: insertError.message };
  }

  await supabase
    .from("ai_event_plans")
    .update({ tasks_applied_at: new Date().toISOString() })
    .eq("id", planId);
  await supabase
    .from("ai_plan_items")
    .update({ applied: true })
    .eq("plan_id", planId)
    .in("category", ["checklist", "task"]);

  revalidatePath(`/dashboard/events/${plan.event_id}`);
  revalidatePath(`/dashboard/events/${plan.event_id}/planner`);
  return { ok: true };
}

const saveAsEventSchema = z.object({
  title: z.string().trim().min(2).max(120),
  planId: z.string().uuid().nullable(),
  eventType: z.string().min(1),
  location: z.string().optional(),
  guestCount: z.number().optional(),
  budget: z.number().optional(),
  eventDate: z.string().optional(),
});

export type SaveAsEventInput = z.infer<typeof saveAsEventSchema>;

export interface SaveAsEventResult {
  ok: boolean;
  error?: string;
  eventId?: string;
}

/**
 * Turns a standalone (not-yet-linked) AI plan into a real dashboard
 * event, and links the plan to it. Used by the "Save Plan" action on
 * the general /ai-planner page (before an event exists yet).
 */
export async function savePlanAsEvent(input: SaveAsEventInput): Promise<SaveAsEventResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Sign in to save this plan." };

  const parsed = saveAsEventSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const values = parsed.data;

  const supabase = createClient();
  const { data: event, error } = await supabase
    .from("events")
    .insert({
      organizer_id: user.id,
      title: values.title,
      slug: slugify(values.title),
      event_type: values.eventType,
      start_date: values.eventDate || new Date().toISOString().slice(0, 10),
      city: values.location || null,
      guest_count: values.guestCount ?? null,
      budget: typeof values.budget === "number" ? values.budget : null,
      visibility: "private",
      status: "draft",
    })
    .select("id")
    .single();

  if (error || !event) {
    return { ok: false, error: error?.message ?? "Couldn't create the event." };
  }

  if (values.planId) {
    await supabase
      .from("ai_event_plans")
      .update({ event_id: event.id })
      .eq("id", values.planId)
      .eq("user_id", user.id);
  }

  revalidatePath("/dashboard/events");
  return { ok: true, eventId: event.id as string };
}
