"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Structural shape shared by any per-day availability record
 * (`VenueAvailabilityDay`, `VendorAvailabilityDay`, ...). Kept generic
 * here so this single calendar can be reused across marketplace
 * domains instead of duplicating it per domain (see Phase 05 vendors).
 */
export interface AvailabilityDayLike {
  date: string; // yyyy-mm-dd
  status: "available" | "booked" | "blocked";
  note?: string | null;
}

const statusStyles: Record<AvailabilityDayLike["status"], string> = {
  available: "bg-emerald-50 text-emerald-700",
  booked: "bg-red-50 text-red-600",
  blocked: "bg-charcoal/10 text-charcoal-400",
};

const statusLabel: Record<AvailabilityDayLike["status"], string> = {
  available: "Available",
  booked: "Booked",
  blocked: "Blocked",
};

function monthKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}`;
}

export function AvailabilityCalendar({
  days,
  onSelectDate,
  selectedDate,
}: {
  days: AvailabilityDayLike[];
  /** When provided, each day becomes a clickable button (editor mode). */
  onSelectDate?: (iso: string) => void;
  selectedDate?: string;
}) {
  const byDate = React.useMemo(() => {
    const map = new Map<string, AvailabilityDayLike>();
    for (const d of days) map.set(d.date, d);
    return map;
  }, [days]);

  const months = React.useMemo(() => {
    if (days.length === 0) {
      // Editor mode with no rows yet: show the next 3 months so a
      // brand-new vendor can still set availability from scratch.
      if (!onSelectDate) return [];
      const now = new Date();
      return [0, 1, 2].map((i) => new Date(now.getFullYear(), now.getMonth() + i, 1));
    }
    const seen = new Set<string>();
    const list: Date[] = [];
    for (const d of days) {
      const date = new Date(d.date + "T00:00:00");
      const first = new Date(date.getFullYear(), date.getMonth(), 1);
      const key = monthKey(first);
      if (!seen.has(key)) {
        seen.add(key);
        list.push(first);
      }
    }
    return list.sort((a, b) => a.getTime() - b.getTime());
  }, [days, onSelectDate]);

  const [monthIndex, setMonthIndex] = React.useState(0);

  if (months.length === 0) {
    return (
      <p className="text-sm text-charcoal-400">Availability calendar isn&apos;t set up for this venue yet.</p>
    );
  }

  const current = months[monthIndex];
  const year = current.getFullYear();
  const month = current.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (Date | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
  ];

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="flex items-center gap-2 text-sm font-medium text-charcoal">
          <CalendarDays className="h-4 w-4 text-purple-600" />
          {current.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Previous month"
            disabled={monthIndex === 0}
            onClick={() => setMonthIndex((i) => Math.max(0, i - 1))}
            className="flex h-8 w-8 items-center justify-center rounded-full text-charcoal-600 hover:bg-purple-50 disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Next month"
            disabled={monthIndex === months.length - 1}
            onClick={() => setMonthIndex((i) => Math.min(months.length - 1, i + 1))}
            className="flex h-8 w-8 items-center justify-center rounded-full text-charcoal-600 hover:bg-purple-50 disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-charcoal-400">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <span key={i} className="py-1">
            {d}
          </span>
        ))}
        {cells.map((date, i) => {
          if (!date) return <span key={`blank-${i}`} />;
          const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
            date.getDate()
          ).padStart(2, "0")}`;
          const entry = byDate.get(iso);
          const status = entry?.status ?? "available";
          const isSelected = selectedDate === iso;

          if (onSelectDate) {
            return (
              <button
                key={iso}
                type="button"
                title={statusLabel[status]}
                onClick={() => onSelectDate(iso)}
                aria-pressed={isSelected}
                className={cn(
                  "flex h-8 items-center justify-center rounded-lg text-xs font-medium text-charcoal ring-purple-600 transition-shadow hover:opacity-80",
                  statusStyles[status],
                  isSelected && "ring-2"
                )}
              >
                {date.getDate()}
              </button>
            );
          }

          return (
            <span
              key={iso}
              title={statusLabel[status]}
              className={cn(
                "flex h-8 items-center justify-center rounded-lg text-xs font-medium text-charcoal",
                statusStyles[status]
              )}
            >
              {date.getDate()}
            </span>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-4 text-xs text-charcoal-400">
        {(Object.keys(statusLabel) as AvailabilityDayLike["status"][]).map((status) => (
          <span key={status} className="flex items-center gap-1.5">
            <span className={cn("h-2.5 w-2.5 rounded-full", statusStyles[status].split(" ")[0])} />
            {statusLabel[status]}
          </span>
        ))}
      </div>
    </div>
  );
}
