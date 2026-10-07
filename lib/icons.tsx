import {
  Sparkles, Heart, Briefcase, Cake, Music, Presentation, GraduationCap, Search,
  CalendarCheck, Wallet, Users, ListChecks, MessageSquare, Ticket, Star, Camera,
  Utensils, Gift, PartyPopper, MapPin, Building2, Trophy, Mic, Palette,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  Sparkles, Heart, Briefcase, Cake, Music, Presentation, GraduationCap, Search,
  CalendarCheck, Wallet, Users, ListChecks, MessageSquare, Ticket, Star, Camera,
  Utensils, Gift, PartyPopper, MapPin, Building2, Trophy, Mic, Palette,
};

/** Resolve an admin-chosen icon name to a lucide component (falls back to Sparkles). */
export function iconByName(name: string | null | undefined): LucideIcon {
  return (name && ICONS[name]) || Sparkles;
}
