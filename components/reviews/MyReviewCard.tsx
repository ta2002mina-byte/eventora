"use client";

import * as React from "react";
import Link from "next/link";
import { Star, PenLine, Trash2, EyeOff } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { ReviewForm } from "@/components/reviews/ReviewForm";
import { deleteReview } from "@/app/dashboard/reviews/actions";
import type { MyReviewItem } from "@/lib/data/reviews";

const TYPE_LABEL: Record<MyReviewItem["type"], string> = {
  vendor: "Vendor",
  venue: "Venue",
  event: "Event",
};

function formatDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function MyReviewCard({ review }: { review: MyReviewItem }) {
  const { toast } = useToast();
  const [editing, setEditing] = React.useState(false);
  const [confirmingDelete, setConfirmingDelete] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  async function onDelete() {
    setIsDeleting(true);
    const result = await deleteReview({
      type: review.type,
      reviewId: review.id,
      targetId: review.targetId,
    });
    setIsDeleting(false);
    setConfirmingDelete(false);

    if (!result.ok) {
      toast({ variant: "error", title: "Couldn't delete review", description: result.error });
      return;
    }
    toast({ variant: "success", title: "Review deleted" });
  }

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="purple">{TYPE_LABEL[review.type]}</Badge>
              {review.status === "hidden" && (
                <Badge variant="gray" className="gap-1">
                  <EyeOff className="h-3 w-3" /> Hidden
                </Badge>
              )}
            </div>
            <Link
              href={review.targetHref}
              className="mt-1.5 block text-base font-medium text-charcoal hover:text-purple-700 hover:underline"
            >
              {review.targetName}
            </Link>
            <p className="mt-1 flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={
                    i < review.rating
                      ? "h-3.5 w-3.5 fill-gold-400 text-gold-400"
                      : "h-3.5 w-3.5 text-charcoal/15"
                  }
                />
              ))}
              <span className="ml-2 text-xs text-charcoal-400">{formatDate(review.created_at)}</span>
            </p>
          </div>
          <div className="flex shrink-0 gap-1.5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setEditing(true)}
              aria-label="Edit review"
            >
              <PenLine className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setConfirmingDelete(true)}
              aria-label="Delete review"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {review.title && <p className="mt-3 text-sm font-medium text-charcoal">{review.title}</p>}
        {review.comment && <p className="mt-1 text-sm text-charcoal-600">{review.comment}</p>}
      </CardContent>

      <Modal open={editing} onClose={() => setEditing(false)} title="Edit your review">
        <ReviewForm
          type={review.type}
          targetId={review.targetId}
          existingReview={review}
          onDone={() => setEditing(false)}
        />
      </Modal>

      <Modal
        open={confirmingDelete}
        onClose={() => setConfirmingDelete(false)}
        title="Delete this review?"
        description={`This removes your review of ${review.targetName}. This can't be undone.`}
      >
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => setConfirmingDelete(false)}>
            Cancel
          </Button>
          <Button type="button" variant="danger" isLoading={isDeleting} onClick={onDelete}>
            Delete review
          </Button>
        </div>
      </Modal>
    </Card>
  );
}
