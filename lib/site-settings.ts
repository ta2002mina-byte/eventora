import "server-only";
import { unstable_cache } from "next/cache";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import {
  DEFAULT_SETTINGS,
  SETTINGS_GROUPS,
  mergeGroup,
  type SiteSettings,
} from "@/lib/site-settings-defaults";

export const SITE_SETTINGS_TAG = "site-settings";

/**
 * Admin-editable site content. Read with the anon key (the table is
 * publicly readable by RLS) and cached; saving from /admin/settings
 * calls revalidateTag(SITE_SETTINGS_TAG) so changes show up at once.
 * Falls back to the built-in defaults if the table is missing/empty,
 * so the site never breaks before migration 0011 is applied.
 */
export const getSiteSettings = unstable_cache(
  async (): Promise<SiteSettings> => {
    try {
      const supabase = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { auth: { persistSession: false } }
      );
      const { data, error } = await supabase.from("site_settings").select("key, value");
      if (error || !data) return DEFAULT_SETTINGS;
      const byKey = new Map<string, unknown>(data.map((r: { key: string; value: unknown }) => [r.key, r.value]));
      const out = { ...DEFAULT_SETTINGS } as SiteSettings;
      for (const group of SETTINGS_GROUPS) {
        (out as unknown as Record<string, unknown>)[group] = mergeGroup(group, byKey.get(group));
      }
      return out;
    } catch {
      return DEFAULT_SETTINGS;
    }
  },
  ["site-settings"],
  { tags: [SITE_SETTINGS_TAG], revalidate: 300 }
);
