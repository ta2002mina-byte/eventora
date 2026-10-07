import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { EventBudgetRecord, BudgetExpenseRecord } from "@/types/budget";

/** The event's budget settings row. Auto-provisioned on first read so every
 * event has one, seeded from the legacy `events.budget` total when present. */
export async function getOrCreateEventBudget(
  eventId: string,
  fallbackTotal: number | null
): Promise<EventBudgetRecord> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("event_budget")
    .select("*")
    .eq("event_id", eventId)
    .maybeSingle();

  if (error) {
    console.error("getOrCreateEventBudget:", error.message);
  }
  if (data) return data as EventBudgetRecord;

  const { data: created, error: insertError } = await supabase
    .from("event_budget")
    .insert({ event_id: eventId, total_amount: fallbackTotal ?? 0 })
    .select("*")
    .single();

  if (insertError || !created) {
    console.error("getOrCreateEventBudget (insert):", insertError?.message);
    // Fall back to an in-memory shape so the page can still render.
    return {
      id: eventId,
      event_id: eventId,
      total_amount: fallbackTotal ?? 0,
      currency: "BDT",
      notes: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }
  return created as EventBudgetRecord;
}

export async function getBudgetExpenses(eventId: string): Promise<BudgetExpenseRecord[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("budget_expenses")
    .select("*")
    .eq("event_id", eventId)
    .order("is_paid", { ascending: true })
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getBudgetExpenses:", error.message);
    return [];
  }
  return (data as BudgetExpenseRecord[]) ?? [];
}

export interface EventVendorOption {
  id: string;
  business_name: string;
}

/** Vendors the organizer has already contacted for this event (via a quote
 * request), offered as the "associate with a vendor" options on an expense. */
export async function getEventAssociatedVendors(eventId: string): Promise<EventVendorOption[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("vendor_bookings")
    .select("vendor_id, vendors ( id, business_name )")
    .eq("event_id", eventId);

  if (error) {
    console.error("getEventAssociatedVendors:", error.message);
    return [];
  }

  const seen = new Map<string, EventVendorOption>();
  for (const row of (data ?? []) as unknown as { vendor_id: string; vendors: { id: string; business_name: string } | null }[]) {
    if (row.vendors) seen.set(row.vendors.id, row.vendors);
  }
  return Array.from(seen.values());
}
