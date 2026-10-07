"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";

export interface ToggleFavoriteResult {
  ok: boolean;
  favorited: boolean;
  error?: string;
}

/**
 * Adds/removes an event from the signed-in user's favorites.
 * Requires authentication — RLS also enforces this at the database level.
 */
export async function toggleFavorite(eventId: string): Promise<ToggleFavoriteResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, favorited: false, error: "Sign in to save events." };
  }

  const supabase = createClient();

  const { data: existing } = await supabase
    .from("favorites")
    .select("id")
    .eq("user_id", user.id)
    .eq("event_id", eventId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase.from("favorites").delete().eq("id", existing.id);
    if (error) return { ok: false, favorited: true, error: error.message };
    revalidatePath("/events");
    return { ok: true, favorited: false };
  }

  const { error } = await supabase
    .from("favorites")
    .insert({ user_id: user.id, event_id: eventId });

  if (error) return { ok: false, favorited: false, error: error.message };
  revalidatePath("/events");
  return { ok: true, favorited: true };
}
