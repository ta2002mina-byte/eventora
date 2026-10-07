/** Icon names an admin can pick from (no React / lucide import, so it is
 * safe to use from server config). The matching components live in
 * lib/icons.tsx. */
export const ICON_NAMES = [
  "Sparkles",
  "Heart",
  "Briefcase",
  "Cake",
  "Music",
  "Presentation",
  "GraduationCap",
  "Search",
  "CalendarCheck",
  "Wallet",
  "Users",
  "ListChecks",
  "MessageSquare",
  "Ticket",
  "Star",
  "Camera",
  "Utensils",
  "Gift",
  "PartyPopper",
  "MapPin",
  "Building2",
  "Trophy",
  "Mic",
  "Palette",
] as const;

export type IconName = (typeof ICON_NAMES)[number];

export const ICON_OPTIONS = ICON_NAMES.map((n) => ({ value: n, label: n }));
