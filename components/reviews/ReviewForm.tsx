"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { StarRatingInput } from "@/components/reviews/StarRatingInput";
import { submitReview, updateReview } from "@/app/dashboard/reviews/actions";
import type { ReviewableType } from "@/lib/data/reviews";

export function ReviewForm({
  type,
  targetId,
  existingReview,
  onDone,
}: {
  type: ReviewableType;
  targetId: string;
  existingReview?: { id: string; rating: number; title: string | null; comment: string | null };
  /** Called after a successful save — e.g. to close a modal. */
  onDone?: () => void;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [rating, setRating] = React.useState(existingReview?.rating ?? 0);
  const [title, setTitle] = React.useState(existingReview?.title ?? "");
  const [comment, setComment] = React.useState(existingReview?.comment ?? "");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) {
      setError("Choose a rating");
      return;
    }
    setError(null);
    setIsSubmitting(true);

    const result = existingReview
      ? await updateReview({
          type,
          reviewId: existingReview.id,
          targetId,
          rating,
          title,
          comment,
        })
      : await submitReview({ type, targetId, rating, title, comment });

    setIsSubmitting(false);

    if (!result.ok) {
      toast({ variant: "error", title: "Couldn't save review", description: result.error });
      return;
    }

    toast({
      variant: "success",
      title: existingReview ? "Review updated" : "Review submitted",
      description: existingReview ? undefined : "Thanks for sharing your experience!",
    });
    router.refresh();
    onDone?.();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <p className="mb-1.5 text-sm font-medium text-charcoal">Your rating</p>
        <StarRatingInput value={rating} onChange={setRating} />
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
      <Input
        label="Title (optional)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={120}
        placeholder="Sum it up in a few words"
      />
      <Textarea
        label="Your review (optional)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        maxLength={2000}
        rows={4}
        placeholder="What went well? What should others know?"
      />
      <div className="flex justify-end gap-2">
        {onDone && (
          <Button type="button" variant="ghost" onClick={onDone}>
            Cancel
          </Button>
        )}
        <Button type="submit" isLoading={isSubmitting}>
          {existingReview ? "Save changes" : "Submit review"}
        </Button>
      </div>
    </form>
  );
}
