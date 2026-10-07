import { Check, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import type { VendorPackage, VendorService } from "@/types/vendor";

function formatPrice(price: number, currency: string) {
  return price > 0 ? `${currency} ${price.toLocaleString()}` : "Contact for pricing";
}

export function VendorServicesList({
  services,
  currency,
}: {
  services: VendorService[];
  currency: string;
}) {
  if (services.length === 0) {
    return <p className="text-sm text-charcoal-400">This vendor hasn&apos;t listed individual services yet.</p>;
  }

  return (
    <ul className="divide-y divide-border rounded-card border border-border bg-white">
      {services.map((service) => (
        <li key={service.id} className="flex items-start justify-between gap-4 p-4">
          <div>
            <p className="text-sm font-medium text-charcoal">{service.name}</p>
            {service.description && (
              <p className="mt-0.5 text-sm text-charcoal-400">{service.description}</p>
            )}
          </div>
          <div className="shrink-0 text-right">
            <p className="text-sm font-medium text-purple-700">{formatPrice(service.price, currency)}</p>
            {service.unit && <p className="text-xs text-charcoal-400">{service.unit}</p>}
          </div>
        </li>
      ))}
    </ul>
  );
}

export function VendorPackagesList({
  packages,
  currency,
  onSelect,
  selectedId,
}: {
  packages: VendorPackage[];
  currency: string;
  onSelect?: (pkg: VendorPackage) => void;
  selectedId?: string;
}) {
  if (packages.length === 0) {
    return <p className="text-sm text-charcoal-400">This vendor hasn&apos;t published packages yet.</p>;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {packages.map((pkg) => {
        const selected = selectedId === pkg.id;
        return (
          <button
            key={pkg.id}
            type="button"
            onClick={() => onSelect?.(pkg)}
            className={`flex h-full flex-col rounded-card border p-4 text-left transition-colors ${
              selected
                ? "border-purple-600 bg-purple-50/60"
                : "border-border bg-white hover:border-purple-300"
            } ${onSelect ? "cursor-pointer" : "cursor-default"}`}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium text-charcoal">{pkg.name}</p>
              {pkg.is_popular && (
                <Badge variant="gold">
                  <Sparkles className="h-3 w-3" /> Popular
                </Badge>
              )}
            </div>
            <p className="mt-1 text-lg font-medium text-purple-700">
              {formatPrice(pkg.price, currency)}
            </p>
            {pkg.duration && <p className="text-xs text-charcoal-400">{pkg.duration}</p>}
            {pkg.description && (
              <p className="mt-2 text-sm text-charcoal-600">{pkg.description}</p>
            )}
            {pkg.included_services.length > 0 && (
              <ul className="mt-3 space-y-1.5">
                {pkg.included_services.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-charcoal-600">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-purple-600" />
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </button>
        );
      })}
    </div>
  );
}
