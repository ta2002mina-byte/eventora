"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  Sparkles,
  Users,
  Wallet,
  ClipboardList,
  Ticket,
  Heart,
  MessageSquare,
  Star,
  Bell,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface DashboardNavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  featured?: boolean;
  badge?: number;
}

export const dashboardNav: DashboardNavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/events", label: "My Events", icon: CalendarDays },
  { href: "/ai-planner", label: "AI Event Planner", icon: Sparkles, featured: true },
  { href: "/dashboard/guests", label: "Guests", icon: Users },
  { href: "/dashboard/budget", label: "Budget", icon: Wallet },
  { href: "/dashboard/bookings", label: "Bookings", icon: ClipboardList },
  { href: "/tickets", label: "My Tickets", icon: Ticket },
  { href: "/dashboard/saved", label: "Saved", icon: Heart },
  { href: "/dashboard/messages", label: "Messages", icon: MessageSquare },
  { href: "/dashboard/reviews", label: "My Reviews", icon: Star },
  { href: "/dashboard/notifications", label: "Notifications", icon: Bell },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function DashboardNavLinks({
  items,
  onNavigate,
}: {
  items?: DashboardNavItem[];
  onNavigate?: () => void;
}) {
  const pathname = usePathname() ?? "";
  const navItems = items ?? dashboardNav;

  return (
    <nav aria-label="Dashboard" className="flex flex-col gap-1">
      {navItems.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-purple-700 text-warmwhite"
                : item.featured
                  ? "bg-gold-50 text-gold-600 hover:bg-gold-100"
                  : "text-charcoal-600 hover:bg-purple-50 hover:text-purple-700"
            )}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            <span className="flex-1">{item.label}</span>
            {typeof item.badge === "number" && item.badge > 0 && (
              <span
                className={cn(
                  "flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold",
                  active ? "bg-warmwhite/20 text-warmwhite" : "bg-purple-100 text-purple-700"
                )}
              >
                {item.badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
