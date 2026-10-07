"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { slugify } from "@/lib/utils";

const createEventSchema = z.object({
  title: z.string().trim().min(2, "Give your event a name").max(120),
  eventType: z.string().min(1, "Choose an event type"),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  startDate: z
    .string()
    .min(1, "Choose a start date")
    .refine((v) => !Number.isNaN(Date.parse(v)), "Choose a valid date"),
  endDate: z.string().optional().or(z.literal("")),
  startTime: z.string().optional().or(z.literal("")),
  endTime: z.string().optional().or(z.literal("")),
  city: z.string().trim().max(120).optional().or(z.literal("")),
  locationName: z.string().trim().max(160).optional().or(z.literal("")),
  guestCount: z.coerce.number().int().min(1, "At least 1 guest").max(50000).optional(),
  budget: z.coerce.number().min(0).optional(),
  coverImageUrl: z.string().trim().url("Enter a valid image URL").optional().or(z.literal("")),
  visibility: z.enum(["private", "public"]).default("private"),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;

export interface CreateEventResult {
  ok: boolean;
  error?: string;
  fieldErrors?: Partial<Record<keyof CreateEventInput, string>>;
  eventId?: string;
}

/**
 * Creates a new "planning" event owned by the signed-in user. Reuses the
 * Phase 03 `events` table (see migration 0004) — defaults to
 * status "draft" and visibility "private" so it never appears in the
 * public marketplace unless the organizer later publishes it.
 */
export async function createEvent(input: CreateEventInput): Promise<CreateEventResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, error: "Sign in to create an event." };
  }

  const parsed = createEventSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Partial<Record<keyof CreateEventInput, string>> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof CreateEventInput;
      if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { ok: false, error: "Please fix the highlighted fields.", fieldErrors };
  }

  const values = parsed.data;
  const supabase = createClient();

  const { data, error } = await supabase
    .from("events")
    .insert({
      organizer_id: user.id,
      title: values.title,
      slug: slugify(values.title),
      description: values.description || null,
      event_type: values.eventType,
      start_date: values.startDate,
      end_date: values.endDate || null,
      start_time: values.startTime || null,
      end_time: values.endTime || null,
      city: values.city || null,
      location_name: values.locationName || null,
      guest_count: values.guestCount ?? null,
      budget: typeof values.budget === "number" ? values.budget : null,
      cover_image_url: values.coverImageUrl || null,
      visibility: values.visibility,
      status: "draft",
      notes: values.notes || null,
      organizer_name: user.user_metadata?.full_name ?? null,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Couldn't create the event." };
  }

  revalidatePath("/dashboard/events");
  return { ok: true, eventId: data.id as string };
}

/** Convenience wrapper for a <form action> that redirects on success. */
export async function createEventAndRedirect(input: CreateEventInput) {
  const result = await createEvent(input);
  if (result.ok && result.eventId) {
    redirect(`/dashboard/events/${result.eventId}`);
  }
  return result;
}
