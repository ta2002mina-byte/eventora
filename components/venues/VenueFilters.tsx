"use client";

import * as React from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import { SearchBar } from "@/components/ui/SearchBar";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { VENUE_TYPE_OPTIONS, VENUE_AMENITIES } from "@/types/venue";

const sortOptions = [
  { value: "recommended", label: "Recommended" },
  { value: "rating_desc", label: "Highest rated" },
  { value: "price_asc", label: "Price: Low to high" },
  { value: "price_desc", label: "Price: High to low" },
  { value: "capacity_desc", label: "Capacity: Largest first" },
  { value: "newest", label: "Newly listed" },
];

const ratingOptions = [
  { value: "4.5", label: "4.5+ stars" },
  { value: "4", label: "4+ stars" },
  { value: "3", label: "3+ stars" },
];

const FILTER_KEYS = [
  "city",
  "venueType",
  "minCapacity",
  "minPrice",
  "maxPrice",
  "minRating",
  "availableOn",
  "amenities",
];

export function VenueFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [q, setQ] = React.useState(searchParams.get("q") ?? "");
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const selectedAmenities = React.useMemo(
    () => (searchParams.get("amenities") ?? "").split(",").filter(Boolean),
    [searchParams]
  );

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page"); // reset pagination on any filter change
    router.push(`${pathname}?${params.toString()}`);
  }

  function toggleAmenity(amenity: string) {
    const next = selectedAmenities.includes(amenity)
      ? selectedAmenities.filter((a) => a !== amenity)
      : [...selectedAmenities, amenity];
    updateParam("amenities", next.join(","));
  }

  // Debounce free-text search so we don't navigate on every keystroke.
  React.useEffect(() => {
    const current = searchParams.get("q") ?? "";
    if (q === current) return;
    const timeout = setTimeout(() => updateParam("q", q), 400);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const activeCount =
    FILTER_KEYS.filter((k) => searchParams.get(k)).length;

  function clearAll() {
    setQ("");
    router.push(pathname);
  }

  const filterFields = (
    <>
      <Select
        label="Venue type"
        placeholder="All types"
        value={searchParams.get("venueType") ?? ""}
        onChange={(e) => updateParam("venueType", e.target.value)}
        options={VENUE_TYPE_OPTIONS}
      />
      <Input
        label="City"
        placeholder="e.g. Dhaka"
        defaultValue={searchParams.get("city") ?? ""}
        onBlur={(e) => updateParam("city", e.target.value)}
      />
      <Input
        type="number"
        label="Min. guest capacity"
        min={0}
        placeholder="e.g. 100"
        defaultValue={searchParams.get("minCapacity") ?? ""}
        onBlur={(e) => updateParam("minCapacity", e.target.value)}
      />
      <Input
        type="date"
        label="Available on"
        defaultValue={searchParams.get("availableOn") ?? ""}
        onChange={(e) => updateParam("availableOn", e.target.value)}
      />
      <div className="grid grid-cols-2 gap-3">
        <Input
          type="number"
          label="Min price"
          min={0}
          defaultValue={searchParams.get("minPrice") ?? ""}
          onBlur={(e) => updateParam("minPrice", e.target.value)}
        />
        <Input
          type="number"
          label="Max price"
          min={0}
          defaultValue={searchParams.get("maxPrice") ?? ""}
          onBlur={(e) => updateParam("maxPrice", e.target.value)}
        />
      </div>
      <Select
        label="Rating"
        placeholder="Any rating"
        value={searchParams.get("minRating") ?? ""}
        onChange={(e) => updateParam("minRating", e.target.value)}
        options={ratingOptions}
      />
      <div className="sm:col-span-2 lg:col-span-4">
        <span className="mb-1.5 block text-sm font-medium text-charcoal">Amenities</span>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {VENUE_AMENITIES.map((amenity) => (
            <Checkbox
              key={amenity}
              label={amenity}
              checked={selectedAmenities.includes(amenity)}
              onChange={() => toggleAmenity(amenity)}
            />
          ))}
        </div>
      </div>
    </>
  );

  return (
    <div className="mb-8 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchBar
          value={q}
          onChange={setQ}
          onSubmit={(v) => updateParam("q", v)}
          placeholder="Search venues by name, city or description"
          aria-label="Search venues"
          className="flex-1"
        />
        <div className="sm:w-56">
          <Select
            aria-label="Sort venues"
            value={searchParams.get("sort") ?? "recommended"}
            onChange={(e) => updateParam("sort", e.target.value)}
            options={sortOptions}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          className="sm:hidden"
          leftIcon={<SlidersHorizontal className="h-4 w-4" />}
          onClick={() => setMobileOpen((o) => !o)}
        >
          Filters{activeCount > 0 ? ` (${activeCount})` : ""}
        </Button>
      </div>

      <div className="hidden gap-4 rounded-card border border-border bg-white p-4 sm:grid sm:grid-cols-2 lg:grid-cols-4">
        {filterFields}
        {activeCount > 0 && (
          <div className="flex items-end lg:col-span-4">
            <Button variant="ghost" size="sm" leftIcon={<X className="h-4 w-4" />} onClick={clearAll}>
              Clear filters
            </Button>
          </div>
        )}
      </div>

      {mobileOpen && (
        <div className="grid gap-4 rounded-card border border-border bg-white p-4 sm:hidden">
          {filterFields}
          <Button variant="ghost" size="sm" leftIcon={<X className="h-4 w-4" />} onClick={clearAll}>
            Clear filters
          </Button>
        </div>
      )}
    </div>
  );
}
