import { ImageOff } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import type { VendorPortfolioItem } from "@/types/vendor";

/**
 * Real photos arrive once vendors can upload via Supabase Storage
 * (vendor dashboard, Phase 09). Until then each tile renders a
 * styled placeholder using the project name, matching the venue
 * gallery treatment from Phase 04.
 */
export function VendorPortfolioGrid({
  items,
  limit,
}: {
  items: VendorPortfolioItem[];
  limit?: number;
}) {
  const visible = typeof limit === "number" ? items.slice(0, limit) : items;

  if (visible.length === 0) {
    return (
      <EmptyState
        icon={<ImageOff className="h-6 w-6" />}
        title="No portfolio items yet"
        description="This vendor hasn't uploaded any project photos yet."
      />
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {visible.map((item) => (
        <figure
          key={item.id}
          className="group relative flex aspect-square flex-col items-center justify-center overflow-hidden rounded-card bg-gradient-to-br from-purple-50 to-gold-50 p-3 text-center"
        >
          <span className="font-display text-base italic text-purple-700 sm:text-lg">
            {item.project_name ?? "Project"}
          </span>
          {item.caption && (
            <figcaption className="mt-1 line-clamp-2 text-xs text-charcoal-400">
              {item.caption}
            </figcaption>
          )}
        </figure>
      ))}
    </div>
  );
}
