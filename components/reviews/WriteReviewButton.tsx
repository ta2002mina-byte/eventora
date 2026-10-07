"use client";

import * as React from "react";
import Link from "next/link";
import { PenLine } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ReviewForm } from "@/components/reviews/ReviewForm";
import type { ReviewableType } from "@/lib/data/reviews";

export function WriteReviewButton({
  isAuthenticated,
  eligible,
  type,
  targetId,
  existingReview,
}: {
  isAuthenticated: boolean;
  /** Whether the signed-in user has a completed booking to review against. */
  eligible: boolean;
  type: ReviewableType;
  targetId: string;
  existingReview?: { id: string; rating: number; title: string | null; comment: string | null };
}) {
  const [open, setOpen] = React.useState(false);

  if (!isAuthenticated) {
    return (
      <Link href="/auth/login" className="text-sm font-medium text-purple-700 hover:underline">
        Sign in to leave a review
      </Link>
    );
  }

  if (!eligible && !existingReview) {
    return (
      <p className="text-sm text-charcoal-400">
        Reviews are open to customers with a completed booking.
      </p>
    );
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        leftIcon={<PenLine className="h-4 w-4" />}
        onClick={() => setOpen(true)}
      >
        {existingReview ? "Edit your review" : "Write a review"}
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={existingReview ? "Edit your review" : "Write a review"}
      >
        <ReviewForm
          type={type}
          targetId={targetId}
          existingReview={existingReview}
          onDone={() => setOpen(false)}
        />
      </Modal>
    </>
  );
}
