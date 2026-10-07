import type * as React from "react";
import { Star, MessageSquareText } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import type { EventReview } from "@/types/event";

function initials(userId: string) {
  return userId.slice(0, 2).toUpperCase();
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

export function EventReviews({
  reviews,
  ratingAvg,
  ratingCount,
  action,
}: {
  reviews: EventReview[];
  ratingAvg: number;
  ratingCount: number;
  action?: React.ReactNode;
}) {
  const visible = reviews.filter((r) => r.status === "published");

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-2xl font-medium text-charcoal">
            <Star className="h-5 w-5 fill-gold-400 text-gold-400" />
            {ratingCount > 0 ? ratingAvg.toFixed(1) : "—"}
          </span>
          <span className="text-sm text-charcoal-400">
            {ratingCount > 0 ? `${ratingCount} review${ratingCount === 1 ? "" : "s"}` : "No reviews yet"}
          </span>
        </div>
        {action}
      </div>

      {visible.length === 0 ? (
        <EmptyState
          className="mt-4"
          icon={<MessageSquareText className="h-6 w-6" />}
          title="No reviews yet"
          description="Reviews from attendees with a completed booking will appear here."
        />
      ) : (
        <ul className="mt-5 space-y-5">
          {visible.map((review) => (
            <li key={review.id} className="border-b border-border pb-5 last:border-0 last:pb-0">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-lavender-100 text-xs font-medium text-purple-700">
                  {initials(review.user_id)}
                </span>
                <div>
                  <p className="flex items-center gap-1 text-sm font-medium text-charcoal">
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
                  </p>
                  <p className="text-xs text-charcoal-400">{formatDate(review.created_at)}</p>
                </div>
              </div>
              {review.title && <p className="mt-2 text-sm font-medium text-charcoal">{review.title}</p>}
              {review.comment && <p className="mt-1 text-sm text-charcoal-600">{review.comment}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
