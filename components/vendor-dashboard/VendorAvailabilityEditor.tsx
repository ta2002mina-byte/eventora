"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Save } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { AvailabilityCalendar } from "@/components/venues/AvailabilityCalendar";
import { setVendorAvailability } from "@/app/vendor/dashboard/actions";
import type { VendorAvailabilityDay } from "@/types/vendor";

const statusOptions = [
  { value: "available", label: "Available" },
  { value: "booked", label: "Booked" },
  { value: "blocked", label: "Blocked" },
];

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function VendorAvailabilityEditor({ days }: { days: VendorAvailabilityDay[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = React.useState(todayIso());
  const [status, setStatus] = React.useState<"available" | "booked" | "blocked">("available");
  const [note, setNote] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const byDate = React.useMemo(() => new Map(days.map((d) => [d.date, d])), [days]);

  function selectDate(iso: string) {
    setSelectedDate(iso);
    const existing = byDate.get(iso);
    setStatus(existing?.status ?? "available");
    setNote(existing?.note ?? "");
  }

  async function handleSave() {
    setSaving(true);
    const result = await setVendorAvailability({ date: selectedDate, status, note });
    setSaving(false);
    if (!result.ok) {
      toast({ variant: "error", title: "Couldn't update availability", description: result.error });
      return;
    }
    toast({ variant: "success", title: "Availability updated" });
    router.refresh();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <Card>
        <CardContent className="p-5">
          <AvailabilityCalendar days={days} onSelectDate={selectDate} selectedDate={selectedDate} />
        </CardContent>
      </Card>

      <Card className="h-fit">
        <CardContent className="p-5">
          <p className="flex items-center gap-2 text-sm font-medium text-charcoal">
            <CalendarDays className="h-4 w-4 text-purple-600" />
            {new Date(selectedDate + "T00:00:00").toLocaleDateString(undefined, {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
          <div className="mt-4 space-y-4">
            <Select
              label="Status"
              options={statusOptions}
              value={status}
              onChange={(e) => setStatus(e.target.value as typeof status)}
            />
            <Input
              label="Note (optional)"
              placeholder="e.g. Reserved for a wedding"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <Button className="w-full" isLoading={saving} leftIcon={<Save className="h-4 w-4" />} onClick={handleSave}>
              Save
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
