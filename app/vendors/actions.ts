"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";

export interface ToggleVendorFavoriteResult {
  ok: boolean;
  favorited: boolean;
  error?: string;
}

/**
 * Adds/removes a vendor from the signed-in user's saved vendors.
 * Requires authentication — RLS also enforces this at the database level.
 */
export async function toggleVendorFavorite(vendorId: string): Promise<ToggleVendorFavoriteResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, favorited: false, error: "Sign in to save vendors." };
  }

  const supabase = createClient();

  const { data: existing } = await supabase
    .from("vendor_favorites")
    .select("id")
    .eq("user_id", user.id)
    .eq("vendor_id", vendorId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase.from("vendor_favorites").delete().eq("id", existing.id);
    if (error) return { ok: false, favorited: true, error: error.message };
    revalidatePath("/vendors");
    return { ok: true, favorited: false };
  }

  const { error } = await supabase
    .from("vendor_favorites")
    .insert({ user_id: user.id, vendor_id: vendorId });

  if (error) return { ok: false, favorited: false, error: error.message };
  revalidatePath("/vendors");
  return { ok: true, favorited: true };
}

const quoteRequestSchema = z.object({
  vendorId: z.string().uuid(),
  eventName: z.string().trim().min(2, "Tell us what the event is").max(120),
  packageId: z.string().uuid().optional().or(z.literal("")),
  serviceName: z.string().max(160).optional().or(z.literal("")),
  eventDate: z
    .string()
    .min(1, "Choose a date")
    .refine((v) => !Number.isNaN(Date.parse(v)), "Choose a valid date")
    .refine((v) => new Date(v) >= new Date(new Date().toDateString()), "Date must be in the future"),
  guestCount: z.coerce.number().int().min(1, "At least 1 guest").max(20000, "That's a lot of guests"),
  budget: z.coerce.number().min(0).optional(),
  notes: z.string().max(1000).optional().or(z.literal("")),
});

export type QuoteRequestInput = z.infer<typeof quoteRequestSchema>;

export interface RequestVendorQuoteResult {
  ok: boolean;
  error?: string;
  fieldErrors?: Partial<Record<keyof QuoteRequestInput, string>>;
}

/**
 * Submits a vendor quote request for the signed-in user.
 * The event isn't linked to a dashboard event yet — that association
 * arrives once Event Creation ships in Phase 06.
 */
export async function requestVendorQuote(
  input: QuoteRequestInput
): Promise<RequestVendorQuoteResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, error: "Sign in to request a quote." };
  }

  const parsed = quoteRequestSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Partial<Record<keyof QuoteRequestInput, string>> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof QuoteRequestInput;
      if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { ok: false, error: "Please fix the highlighted fields.", fieldErrors };
  }

  const { vendorId, eventName, packageId, serviceName, eventDate, guestCount, budget, notes } =
    parsed.data;
  const supabase = createClient();

  const { error } = await supabase.from("vendor_bookings").insert({
    vendor_id: vendorId,
    user_id: user.id,
    event_name: eventName,
    package_id: packageId || null,
    service_name: serviceName || null,
    event_date: eventDate,
    guest_count: guestCount,
    budget: typeof budget === "number" ? budget : null,
    notes: notes || null,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}
