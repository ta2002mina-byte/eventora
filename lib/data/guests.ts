import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { GuestRecord, GuestTableRecord } from "@/types/guest";

export async function getEventGuests(eventId: string): Promise<GuestRecord[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("guests")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getEventGuests:", error.message);
    return [];
  }
  return (data as GuestRecord[]) ?? [];
}

export async function getEventGuestTables(eventId: string): Promise<GuestTableRecord[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("guest_tables")
    .select("*")
    .eq("event_id", eventId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("getEventGuestTables:", error.message);
    return [];
  }
  return (data as GuestTableRecord[]) ?? [];
}
