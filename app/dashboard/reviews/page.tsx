import type { Metadata } from "next";
import { Star } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getMyReviews } from "@/lib/data/reviews";
import { EmptyState } from "@/components/ui/EmptyState";
import { MyReviewCard } from "@/components/reviews/MyReviewCard";

export const metadata: Metadata = { title: "My Reviews" };

export default async function DashboardReviewsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const reviews = await getMyReviews(user.id);

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
      <h2 className="text-2xl font-medium">My Reviews</h2>
      <p className="mt-1 text-sm text-charcoal-400">
        Reviews you&apos;ve left for events, venues and vendors you&apos;ve booked.
      </p>

      <div className="mt-6">
        {reviews.length === 0 ? (
          <EmptyState
            icon={<Star className="h-5 w-5" />}
            title="No reviews yet"
            description="Once you've completed a booking, you can leave a review from that event, venue or vendor's page."
          />
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <MyReviewCard key={`${review.type}-${review.id}`} review={review} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
