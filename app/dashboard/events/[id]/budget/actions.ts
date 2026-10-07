"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";

interface ActionResult {
  ok: boolean;
  error?: string;
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

function revalidateBudgetPaths(eventId: string) {
  revalidatePath(`/dashboard/events/${eventId}/budget`);
  revalidatePath(`/dashboard/events/${eventId}`);
  revalidatePath(`/dashboard/events/${eventId}/planner`);
}

// ------------------------------------------------------------------
// Total budget
// ------------------------------------------------------------------

const totalSchema = z.object({
  eventId: z.string().uuid(),
  totalAmount: z.coerce.number().min(0),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

export async function setEventBudgetTotal(input: z.infer<typeof totalSchema>): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Sign in to manage the budget." };

  const parsed = totalSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid budget." };
  }
  const values = parsed.data;

  if (!(await assertOwnsEvent(values.eventId, user.id))) {
    return { ok: false, error: "You don't have access to this event." };
  }

  const supabase = createClient();
  const { error } = await supabase
    .from("event_budget")
    .upsert(
      {
        event_id: values.eventId,
        total_amount: values.totalAmount,
        notes: values.notes || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "event_id" }
    );

  if (error) return { ok: false, error: error.message };

  // Keep the legacy events.budget field (used by the event summary card
  // and AI Planner defaults) in sync with the source of truth.
  await supabase
    .from("events")
    .update({ budget: values.totalAmount, updated_at: new Date().toISOString() })
    .eq("id", values.eventId)
    .eq("organizer_id", user.id);

  revalidateBudgetPaths(values.eventId);
  return { ok: true };
}

// ------------------------------------------------------------------
// Expenses
// ------------------------------------------------------------------

const expenseSchema = z.object({
  eventId: z.string().uuid(),
  expenseId: z.string().uuid().optional(),
  category: z.string().min(1, "Choose a category"),
  title: z.string().trim().min(2, "Give the expense a title").max(160),
  plannedAmount: z.coerce.number().min(0),
  actualAmount: z.coerce.number().min(0).default(0),
  isPaid: z.boolean().default(false),
  vendorId: z.string().uuid().optional().or(z.literal("")),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

export type ExpenseInput = z.infer<typeof expenseSchema>;

export async function saveExpense(input: ExpenseInput): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Sign in to manage the budget." };

  const parsed = expenseSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid expense." };
  }
  const values = parsed.data;

  if (!(await assertOwnsEvent(values.eventId, user.id))) {
    return { ok: false, error: "You don't have access to this event." };
  }

  const supabase = createClient();
  const row = {
    event_id: values.eventId,
    category: values.category,
    title: values.title,
    planned_amount: values.plannedAmount,
    actual_amount: values.actualAmount,
    is_paid: values.isPaid,
    vendor_id: values.vendorId || null,
    notes: values.notes || null,
    updated_at: new Date().toISOString(),
  };

  const { error } = values.expenseId
    ? await supabase.from("budget_expenses").update(row).eq("id", values.expenseId).eq("event_id", values.eventId)
    : await supabase.from("budget_expenses").insert({ ...row, source: "manual" as const });

  if (error) return { ok: false, error: error.message };
  revalidateBudgetPaths(values.eventId);
  return { ok: true };
}

export async function toggleExpensePaid(eventId: string, expenseId: string, isPaid: boolean): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Sign in to manage the budget." };
  if (!(await assertOwnsEvent(eventId, user.id))) {
    return { ok: false, error: "You don't have access to this event." };
  }

  const supabase = createClient();
  const { error } = await supabase
    .from("budget_expenses")
    .update({ is_paid: isPaid, updated_at: new Date().toISOString() })
    .eq("id", expenseId)
    .eq("event_id", eventId);

  if (error) return { ok: false, error: error.message };
  revalidateBudgetPaths(eventId);
  return { ok: true };
}

export async function deleteExpense(eventId: string, expenseId: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Sign in to manage the budget." };
  if (!(await assertOwnsEvent(eventId, user.id))) {
    return { ok: false, error: "You don't have access to this event." };
  }

  const supabase = createClient();
  const { error } = await supabase.from("budget_expenses").delete().eq("id", expenseId).eq("event_id", eventId);

  if (error) return { ok: false, error: error.message };
  revalidateBudgetPaths(eventId);
  return { ok: true };
}
