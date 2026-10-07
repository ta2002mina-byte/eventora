"use client";

import { CalendarPlus } from "lucide-react";
import { Button } from "@/components/ui/Button";

function toIcsDate(date: string, time?: string | null) {
  const [y, m, d] = date.split("-");
  const [h = "00", min = "00"] = (time ?? "00:00").split(":");
  return `${y}${m}${d}T${h.padStart(2, "0")}${min.padStart(2, "0")}00`;
}

export function AddToCalendarButton({
  title,
  description,
  location,
  startDate,
  startTime,
  endDate,
  endTime,
}: {
  title: string;
  description?: string | null;
  location?: string | null;
  startDate: string;
  startTime?: string | null;
  endDate?: string | null;
  endTime?: string | null;
}) {
  function onClick() {
    const dtStart = toIcsDate(startDate, startTime);
    const dtEnd = toIcsDate(endDate ?? startDate, endTime ?? startTime ?? "01:00");

    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "BEGIN:VEVENT",
      `SUMMARY:${title}`,
      description ? `DESCRIPTION:${description.replace(/\n/g, " ")}` : "",
      location ? `LOCATION:${location}` : "",
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ]
      .filter(Boolean)
      .join("\r\n");

    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/\s+/g, "-").toLowerCase()}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Button variant="outline" size="sm" onClick={onClick} leftIcon={<CalendarPlus className="h-4 w-4" />}>
      Add to calendar
    </Button>
  );
}
