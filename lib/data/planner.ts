import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { EventRecord } from "@/types/event";
import type { AiEventPlanRecord, EventTaskRecord } from "@/types/planner";

/** All of the current user's private/draft "planning" events, newest first. */
export async function getUserEvents(userId: string): Promise<EventRecord[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("organizer_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getUserEvents:", error.message);
    return [];
  }
  return (data as EventRecord[]) ?? [];
}

/** A single event, scoped to its owner. RLS already enforces this — the
 * explicit eq() just lets us tell "not found" apart from "not yours". */
export async function getUserEventById(eventId: string, userId: string): Promise<EventRecord | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("id", eventId)
    .eq("organizer_id", userId)
    .maybeSingle();

  if (error) {
    console.error("getUserEventById:", error.message);
    return null;
  }
  return (data as EventRecord) ?? null;
}

export async function getEventTasks(eventId: string): Promise<EventTaskRecord[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("event_tasks")
    .select("*")
    .eq("event_id", eventId)
    .order("is_complete", { ascending: true })
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("getEventTasks:", error.message);
    return [];
  }
  return (data as EventTaskRecord[]) ?? [];
}

export interface EventBookingCounts {
  venueBookings: number;
  vendorBookings: number;
}

/** Counts venue/vendor booking requests linked to this event (Phase 04/05
 * quote & booking forms can optionally associate to a dashboard event). */
export async function getEventBookingCounts(eventId: string): Promise<EventBookingCounts> {
  const supabase = createClient();
  const [venue, vendor] = await Promise.all([
    supabase.from("venue_bookings").select("id", { count: "exact", head: true }).eq("event_id", eventId),
    supabase.from("vendor_bookings").select("id", { count: "exact", head: true }).eq("event_id", eventId),
  ]);

  return {
    venueBookings: venue.count ?? 0,
    vendorBookings: vendor.count ?? 0,
  };
}

export async function getLatestPlanForEvent(eventId: string): Promise<AiEventPlanRecord | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("ai_event_plans")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("getLatestPlanForEvent:", error.message);
    return null;
  }
  return (data as AiEventPlanRecord) ?? null;
}

/** Planner completion, simple heuristic used for the progress ring/bar:
 * key event fields set + share of tasks completed. */
export function getEventProgress(event: EventRecord, tasks: EventTaskRecord[]) {
  const fieldChecks = [
    !!event.title,
    !!event.description,
    !!event.start_date,
    !!(event.location_name || event.city),
    !!event.guest_count,
    !!event.budget,
    !!event.cover_image_url,
  ];
  const fieldsComplete = fieldChecks.filter(Boolean).length;
  const fieldScore = fieldsComplete / fieldChecks.length;

  const taskScore =
    tasks.length === 0 ? 0 : tasks.filter((t) => t.is_complete).length / tasks.length;

  // Weight tasks a little higher once there are some — the event card
  // fields are a one-time setup, tasks reflect ongoing planning progress.
  const weight = tasks.length > 0 ? 0.4 : 1;
  const percent = Math.round((fieldScore * weight + taskScore * (1 - weight)) * 100);

  return {
    percent: Math.min(100, Math.max(0, percent)),
    fieldsComplete,
    fieldsTotal: fieldChecks.length,
    tasksComplete: tasks.filter((t) => t.is_complete).length,
    tasksTotal: tasks.length,
  };
}
