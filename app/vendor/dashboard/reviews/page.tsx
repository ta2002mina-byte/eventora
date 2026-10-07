import type { Metadata } from "next";
import { Star, MessageSquareText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { getCurrentUser } from "@/lib/auth";
import { getVendorForOwner, getVendorReviewStats } from "@/lib/data/vendor-dashboard";
import { profileDisplayName, profileInitials } from "@/types/profile";

export const metadata: Metadata = { title: "Reviews" };

function formatDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, { month: "short", year: "numeric" });
}

export default async function VendorReviewsPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const vendor = await getVendorForOwner(user.id);
  if (!vendor) return null;

  const stats = await getVendorReviewStats(vendor);
  const maxCount = Math.max(1, ...Object.values(stats.breakdown));

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
      <div>
        <h2 className="text-2xl font-medium">Reviews</h2>
        <p className="mt-1 text-sm text-charcoal-400">What customers are saying about your business.</p>
      </div>

      <Card className="mt-6">
        <CardContent className="flex flex-col gap-6 p-5 sm:flex-row sm:items-center">
          <div className="flex shrink-0 flex-col items-center justify-center sm:w-32">
            <p className="flex items-center gap-1.5 text-3xl font-medium text-charcoal">
              <Star className="h-6 w-6 fill-gold-400 text-gold-400" />
              {stats.count > 0 ? stats.average.toFixed(1) : "—"}
            </p>
            <p className="mt-1 text-sm text-charcoal-400">
              {stats.count} review{stats.count === 1 ? "" : "s"}
            </p>
          </div>
          <div className="flex-1 space-y-1.5">
            {([5, 4, 3, 2, 1] as const).map((star) => (
              <div key={star} className="flex items-center gap-2 text-xs text-charcoal-400">
                <span className="w-8 shrink-0">{star} star</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-charcoal/5">
                  <div
                    className="h-full rounded-full bg-gold-400"
                    style={{ width: `${(stats.breakdown[star] / maxCount) * 100}%` }}
                  />
                </div>
                <span className="w-6 shrink-0 text-right">{stats.breakdown[star]}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="mt-8">
        {stats.reviews.length === 0 ? (
          <EmptyState
            icon={<MessageSquareText className="h-6 w-6" />}
            title="No reviews yet"
            description="Reviews from customers with completed bookings will appear here."
          />
        ) : (
          <ul className="space-y-5">
            {stats.reviews.map((review) => (
              <li key={review.id} className="border-b border-border pb-5 last:border-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-lavender-100 text-xs font-medium text-purple-700">
                    {profileInitials(review.customer)}
                  </span>
                  <div>
                    <p className="flex items-center gap-2 text-sm font-medium text-charcoal">
                      {profileDisplayName(review.customer)}
                      <span className="flex items-center gap-0.5">
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
                      </span>
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
    </main>
  );
}
