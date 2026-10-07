import type { Metadata } from "next";
import Link from "next/link";
import { Heart, CalendarDays, Building2, Store, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { getCurrentUser } from "@/lib/auth";
import { getSavedItems, type SavedItem } from "@/lib/data/dashboard";

export const metadata: Metadata = { title: "Saved" };

const kindMeta = {
  event: { label: "Event", icon: CalendarDays },
  venue: { label: "Venue", icon: Building2 },
  vendor: { label: "Vendor", icon: Store },
} as const;

function SavedCard({ item }: { item: SavedItem }) {
  const meta = kindMeta[item.kind];
  const Icon = meta.icon;
  return (
    <Card hoverable className="overflow-hidden">
      <Link href={item.href} className="block">
        <div className="relative flex aspect-[16/10] items-center justify-center bg-gradient-to-br from-purple-100 to-lavender-100 text-purple-700">
          <Icon className="h-8 w-8" />
          <span className="absolute left-3 top-3">
            <Badge variant="purple">{meta.label}</Badge>
          </span>
        </div>
        <CardContent className="p-4">
          <p className="truncate font-medium text-charcoal">{item.title}</p>
          {item.subtitle && (
            <p className="mt-0.5 truncate text-sm capitalize text-charcoal-400">{item.subtitle}</p>
          )}
          <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-purple-700">
            View <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </CardContent>
      </Link>
    </Card>
  );
}

export default async function DashboardSavedPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const items = await getSavedItems(user.id);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <div>
        <h2 className="text-2xl font-medium">Saved</h2>
        <p className="mt-1 text-sm text-charcoal-400">
          Events, venues and vendors you&apos;ve favorited.
        </p>
      </div>

      {items.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={<Heart className="h-5 w-5" />}
            title="Nothing saved yet"
            description="Tap the heart on any event, venue or vendor to save it for later."
            className="mb-2"
          />
          <div className="flex justify-center gap-2">
            <Link href="/events">
              <Button variant="outline" size="sm">
                Explore events
              </Button>
            </Link>
            <Link href="/venues">
              <Button variant="outline" size="sm">
                Explore venues
              </Button>
            </Link>
            <Link href="/vendors">
              <Button variant="outline" size="sm">
                Explore vendors
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <SavedCard key={`${item.kind}-${item.id}`} item={item} />
          ))}
        </div>
      )}
    </main>
  );
}
