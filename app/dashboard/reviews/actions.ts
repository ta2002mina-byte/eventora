"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { REVIEW_TABLE, type ReviewableType } from "@/lib/data/reviews";

export interface ActionResult {
  ok: boolean;
  error?: string;
}

const FK_COLUMN: Record<ReviewableType, string> = {
  vendor: "vendor_id",
  venue: "venue_id",
  event: "event_id",
};

const DETAIL_PATH: Record<ReviewableType, (id: string) => string> = {
  vendor: (id) => `/vendors/${id}`,
  venue: (id) => `/venues/${id}`,
  event: (id) => `/events/${id}`,
};

const reviewSchema = z.object({
  type: z.enum(["vendor", "venue", "event"]),
  targetId: z.string().uuid(),
  rating: z.coerce.number().int().min(1, "Choose a rating").max(5),
  title: z.string().trim().max(120).optional().or(z.literal("")),
  comment: z.string().trim().max(2000).optional().or(z.literal("")),
});

export type SubmitReviewInput = z.infer<typeof reviewSchema>;

/** Creates a review. RLS (`eligible users can create ... reviews`)
 * independently re-checks the completed-booking requirement at the
 * database level, so this can't be bypassed even if the UI's
 * eligibility check is ever wrong or stale. */
export async function submitReview(input: SubmitReviewInput): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Sign in to leave a review." };

  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid review." };
  }

  const { type, targetId, rating, title, comment } = parsed.data;
  const supabase = createClient();

  const { error } = await supabase.from(REVIEW_TABLE[type]).insert({
    [FK_COLUMN[type]]: targetId,
    user_id: user.id,
    rating,
    title: title || null,
    comment: comment || null,
  });

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "You've already reviewed this — edit it from My Reviews instead." };
    }
    if (error.code === "42501") {
      return { ok: false, error: "Only customers with a completed booking can leave a review." };
    }
    return { ok: false, error: error.message };
  }

  revalidatePath(DETAIL_PATH[type](targetId));
  revalidatePath("/dashboard/reviews");
  return { ok: true };
}

const updateSchema = z.object({
  type: z.enum(["vendor", "venue", "event"]),
  reviewId: z.string().uuid(),
  targetId: z.string().uuid(),
  rating: z.coerce.number().int().min(1, "Choose a rating").max(5),
  title: z.string().trim().max(120).optional().or(z.literal("")),
  comment: z.string().trim().max(2000).optional().or(z.literal("")),
});

export type UpdateReviewInput = z.infer<typeof updateSchema>;

export async function updateReview(input: UpdateReviewInput): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Sign in required." };

  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid review." };
  }

  const { type, reviewId, targetId, rating, title, comment } = parsed.data;
  const supabase = createClient();

  const { error } = await supabase
    .from(REVIEW_TABLE[type])
    .update({
      rating,
      title: title || null,
      comment: comment || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", reviewId)
    .eq("user_id", user.id);

  if (error) return { ok: false, error: error.message };

  revalidatePath(DETAIL_PATH[type](targetId));
  revalidatePath("/dashboard/reviews");
  return { ok: true };
}

export async function deleteReview(input: {
  type: ReviewableType;
  reviewId: string;
  targetId: string;
}): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Sign in required." };

  const supabase = createClient();
  const { error } = await supabase
    .from(REVIEW_TABLE[input.type])
    .delete()
    .eq("id", input.reviewId)
    .eq("user_id", user.id);

  if (error) return { ok: false, error: error.message };

  revalidatePath(DETAIL_PATH[input.type](input.targetId));
  revalidatePath("/dashboard/reviews");
  return { ok: true };
}
