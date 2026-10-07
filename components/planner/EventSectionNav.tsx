import Link from "next/link";
import { cn } from "@/lib/utils";

export type EventSection = "overview" | "planner" | "ai-planner" | "guests" | "budget";

const sections: { key: EventSection; label: string; href: (id: string) => string }[] = [
  { key: "overview", label: "Overview", href: (id) => `/dashboard/events/${id}` },
  { key: "planner", label: "Planner", href: (id) => `/dashboard/events/${id}/planner` },
  { key: "ai-planner", label: "AI Planner", href: (id) => `/dashboard/events/${id}/ai-planner` },
  { key: "guests", label: "Guests", href: (id) => `/dashboard/events/${id}/guests` },
  { key: "budget", label: "Budget", href: (id) => `/dashboard/events/${id}/budget` },
];

export function EventSectionNav({
  eventId,
  active,
  className,
}: {
  eventId: string;
  active: EventSection;
  className?: string;
}) {
  return (
    <nav aria-label="Event sections" className={cn("flex flex-wrap gap-1 border-b border-border", className)}>
      {sections.map((section) => (
        <Link
          key={section.key}
          href={section.href(eventId)}
          aria-current={active === section.key ? "page" : undefined}
          className={cn(
            "relative px-3.5 py-2.5 text-sm font-medium transition-colors",
            active === section.key ? "text-purple-700" : "text-charcoal-400 hover:text-charcoal"
          )}
        >
          {section.label}
          {active === section.key && (
            <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-purple-700" />
          )}
        </Link>
      ))}
    </nav>
  );
}
