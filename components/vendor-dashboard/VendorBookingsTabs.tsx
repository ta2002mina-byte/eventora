"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

const tabs: { value: string | undefined; label: string }[] = [
  { value: undefined, label: "All" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export function VendorBookingsTabs({ active }: { active?: string }) {
  return (
    <div className="flex flex-wrap gap-2 border-b border-border pb-2">
      {tabs.map((tab) => {
        const isActive = tab.value === active;
        const href = tab.value ? `/vendor/dashboard/bookings?status=${tab.value}` : "/vendor/dashboard/bookings";
        return (
          <Link
            key={tab.label}
            href={href}
            className={cn(
              "rounded-pill px-3 py-1.5 text-sm font-medium transition-colors",
              isActive ? "bg-purple-700 text-warmwhite" : "text-charcoal-600 hover:bg-purple-50"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
