import Link from "next/link";
import { MapPin, Star, Briefcase } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { VendorFavoriteButton } from "@/components/vendors/VendorFavoriteButton";
import {
  VENDOR_CATEGORY_LABELS,
  formatVendorExperience,
  formatVendorPrice,
} from "@/types/vendor";
import type { VendorRecord } from "@/types/vendor";

export function VendorCard({
  vendor,
  favorited = false,
}: {
  vendor: VendorRecord;
  favorited?: boolean;
}) {
  return (
    <Link href={`/vendors/${vendor.slug}`} className="block h-full">
      <Card hoverable className="flex h-full flex-col overflow-hidden">
        <div className="relative flex h-40 items-center justify-center bg-gradient-to-br from-lavender-100 to-gold-100">
          <span className="font-display text-2xl italic text-purple-700">
            {vendor.business_name.split(" ")[0]}
          </span>
          <VendorFavoriteButton
            vendorId={vendor.id}
            initialFavorited={favorited}
            className="absolute right-3 top-3"
          />
          {vendor.rating_count > 0 && (
            <Badge variant="gold" className="absolute left-3 top-3">
              <Star className="h-3 w-3 fill-current" /> {vendor.rating_avg.toFixed(1)}
            </Badge>
          )}
        </div>

        <CardContent className="flex flex-1 flex-col">
          <div className="flex items-center justify-between gap-2">
            <Badge variant="purple">{VENDOR_CATEGORY_LABELS[vendor.category]}</Badge>
            <span className="text-sm font-medium text-purple-700">
              From {formatVendorPrice(vendor)}
            </span>
          </div>

          <h3 className="mt-3 line-clamp-2 text-base font-medium text-charcoal">
            {vendor.business_name}
          </h3>

          {vendor.description && (
            <p className="mt-1.5 line-clamp-2 text-sm text-charcoal-400">{vendor.description}</p>
          )}

          <div className="mt-3 space-y-1.5 text-sm text-charcoal-400">
            {(vendor.address || vendor.city) && (
              <p className="flex items-center gap-2">
                <MapPin className="h-4 w-4 shrink-0" />
                <span className="line-clamp-1">
                  {[vendor.address, vendor.city].filter(Boolean).join(", ")}
                </span>
              </p>
            )}
            <p className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 shrink-0" />
              {formatVendorExperience(vendor)}
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
