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

function revalidateGuestPaths(eventId: string) {
  revalidatePath(`/dashboard/events/${eventId}/guests`);
  revalidatePath(`/dashboard/events/${eventId}`);
  revalidatePath(`/dashboard/events/${eventId}/planner`);
}

// ------------------------------------------------------------------
// Guests
// ------------------------------------------------------------------

const guestSchema = z.object({
  eventId: z.string().uuid(),
  guestId: z.string().uuid().optional(),
  name: z.string().trim().min(2, "Give the guest a name").max(160),
  email: z.string().trim().email("Enter a valid email").max(200).optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  groupName: z.string().trim().max(120).optional().or(z.literal("")),
  rsvpStatus: z.enum(["pending", "invited", "confirmed", "declined"]).default("pending"),
  mealPreference: z.string().trim().max(120).optional().or(z.literal("")),
  plusOne: z.boolean().default(false),
  plusOneName: z.string().trim().max(160).optional().or(z.literal("")),
  tableId: z.string().uuid().optional().or(z.literal("")),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

export type GuestInput = z.infer<typeof guestSchema>;

export async function saveGuest(input: GuestInput): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Sign in to manage guests." };

  const parsed = guestSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid guest." };
  }
  const values = parsed.data;

  if (!(await assertOwnsEvent(values.eventId, user.id))) {
    return { ok: false, error: "You don't have access to this event." };
  }

  const supabase = createClient();
  const row = {
    event_id: values.eventId,
    name: values.name,
    email: values.email || null,
    phone: values.phone || null,
    group_name: values.groupName || null,
    rsvp_status: values.rsvpStatus,
    meal_preference: values.mealPreference || null,
    plus_one: values.plusOne,
    plus_one_name: values.plusOne ? values.plusOneName || null : null,
    table_id: values.tableId || null,
    notes: values.notes || null,
    updated_at: new Date().toISOString(),
  };

  const { error } = values.guestId
    ? await supabase.from("guests").update(row).eq("id", values.guestId).eq("event_id", values.eventId)
    : await supabase.from("guests").insert(row);

  if (error) return { ok: false, error: error.message };
  revalidateGuestPaths(values.eventId);
  return { ok: true };
}

export async function updateGuestRsvp(
  eventId: string,
  guestId: string,
  rsvpStatus: "pending" | "invited" | "confirmed" | "declined"
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Sign in to manage guests." };
  if (!(await assertOwnsEvent(eventId, user.id))) {
    return { ok: false, error: "You don't have access to this event." };
  }

  const supabase = createClient();
  const { error } = await supabase
    .from("guests")
    .update({ rsvp_status: rsvpStatus, updated_at: new Date().toISOString() })
    .eq("id", guestId)
    .eq("event_id", eventId);

  if (error) return { ok: false, error: error.message };
  revalidateGuestPaths(eventId);
  return { ok: true };
}

export async function deleteGuest(eventId: string, guestId: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Sign in to manage guests." };
  if (!(await assertOwnsEvent(eventId, user.id))) {
    return { ok: false, error: "You don't have access to this event." };
  }

  const supabase = createClient();
  const { error } = await supabase.from("guests").delete().eq("id", guestId).eq("event_id", eventId);

  if (error) return { ok: false, error: error.message };
  revalidateGuestPaths(eventId);
  return { ok: true };
}

// ------------------------------------------------------------------
// Guest tables (seating)
// ------------------------------------------------------------------

const tableSchema = z.object({
  eventId: z.string().uuid(),
  tableId: z.string().uuid().optional(),
  name: z.string().trim().min(1, "Give the table a name").max(80),
  capacity: z.coerce.number().int().min(1).max(100),
});

export type GuestTableInput = z.infer<typeof tableSchema>;

export async function saveGuestTable(input: GuestTableInput): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Sign in to manage tables." };

  const parsed = tableSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid table." };
  }
  const values = parsed.data;

  if (!(await assertOwnsEvent(values.eventId, user.id))) {
    return { ok: false, error: "You don't have access to this event." };
  }

  const supabase = createClient();
  const { error } = values.tableId
    ? await supabase
        .from("guest_tables")
        .update({ name: values.name, capacity: values.capacity })
        .eq("id", values.tableId)
        .eq("event_id", values.eventId)
    : await supabase.from("guest_tables").insert({
        event_id: values.eventId,
        name: values.name,
        capacity: values.capacity,
      });

  if (error) return { ok: false, error: error.message };
  revalidateGuestPaths(values.eventId);
  return { ok: true };
}

export async function deleteGuestTable(eventId: string, tableId: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Sign in to manage tables." };
  if (!(await assertOwnsEvent(eventId, user.id))) {
    return { ok: false, error: "You don't have access to this event." };
  }

  const supabase = createClient();
  // Guests keep their other fields; the FK is ON DELETE SET NULL so they
  // simply become unassigned rather than being removed.
  const { error } = await supabase.from("guest_tables").delete().eq("id", tableId).eq("event_id", eventId);

  if (error) return { ok: false, error: error.message };
  revalidateGuestPaths(eventId);
  return { ok: true };
}
