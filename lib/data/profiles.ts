import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/profile";

/** Batch profile lookup, keyed by id. Used anywhere a list of rows
 * (reviews, messages, conversation participants) needs display names
 * without one query per row. */
export async function getProfilesByIds(userIds: string[]): Promise<Map<string, Profile>> {
  const map = new Map<string, Profile>();
  const ids = [...new Set(userIds)].filter(Boolean);
  if (ids.length === 0) return map;

  const supabase = createClient();
  const { data, error } = await supabase.from("profiles").select("*").in("id", ids);
  if (error) {
    console.error("getProfilesByIds:", error.message);
    return map;
  }
  for (const row of (data ?? []) as Profile[]) map.set(row.id, row);
  return map;
}

export const getProfileById = cache(async (userId: string): Promise<Profile | null> => {
  const map = await getProfilesByIds([userId]);
  return map.get(userId) ?? null;
});
