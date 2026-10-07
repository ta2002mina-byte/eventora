import "server-only";
import { createClient } from "@/lib/supabase/server";

/**
 * Returns the currently signed-in user (server-side), or null.
 * Safe to call from Server Components, Route Handlers and Server Actions.
 */
export async function getCurrentUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
