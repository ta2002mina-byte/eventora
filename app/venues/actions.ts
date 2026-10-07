"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";

export interface ToggleVenueFavoriteResult {
  ok: boolean;
  favorited: boolean;
  error?: string;
}

/**
 * Adds/removes a venue from the signed-in user's saved venues.
 * Requires authentication — RLS also enforces this at the database level.
 */
export async function toggleVenueFavorite(venueId: string): Promise<ToggleVenueFavoriteResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, favorited: false, error: "Sign in to save venues." };
  }

  const supabase = createClient();

  const { data: existing } = await supabase
    .from("venue_favorites")
    .select("id")
    .eq("user_id", user.id)
    .eq("venue_id", venueId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase.from("venue_favorites").delete().eq("id", existing.id);
    if (error) return { ok: false, favorited: true, error: error.message };
    revalidatePath("/venues");
    return { ok: true, favorited: false };
  }

  const { error } = await supabase
    .from("venue_favorites")
    .insert({ user_id: user.id, venue_id: venueId });

  if (error) return { ok: false, favorited: false, error: error.message };
  revalidatePath("/venues");
  return { ok: true, favorited: true };
}

const bookingRequestSchema = z.object({
  venueId: z.string().uuid(),
  eventName: z.string().trim().min(2, "Tell us what the event is").max(120),
  eventDate: z
    .string()
    .refine((v) => !Number.isNaN(Date.parse(v)), "Choose a valid date")
    .refine((v) => new Date(v) >= new Date(new Date().toDateString()), "Date must be in the future"),
  eventTime: z.string().optional().or(z.literal("")),
  guestCount: z.coerce.number().int().min(1, "At least 1 guest").max(20000, "That's a lot of guests"),
  notes: z.string().max(1000).optional().or(z.literal("")),
});

export type BookingRequestInput = z.infer<typeof bookingRequestSchema>;

export interface RequestVenueBookingResult {
  ok: boolean;
  error?: string;
  fieldErrors?: Partial<Record<keyof BookingRequestInput, string>>;
}

/**
 * Submits a venue booking request for the signed-in user.
 * The event itself isn't linked to a dashboard event yet — that
 * association arrives once Event Creation ships in Phase 06.
 */
export async function requestVenueBooking(
  input: BookingRequestInput
): Promise<RequestVenueBookingResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, error: "Sign in to request a booking." };
  }

  const parsed = bookingRequestSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Partial<Record<keyof BookingRequestInput, string>> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof BookingRequestInput;
      if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { ok: false, error: "Please fix the highlighted fields.", fieldErrors };
  }

  const { venueId, eventName, eventDate, eventTime, guestCount, notes } = parsed.data;
  const supabase = createClient();

  const { error } = await supabase.from("venue_bookings").insert({
    venue_id: venueId,
    user_id: user.id,
    event_name: eventName,
    event_date: eventDate,
    event_time: eventTime || null,
    guest_count: guestCount,
    notes: notes || null,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}
