import {
  LayoutDashboard,
  User,
  Wrench,
  Package,
  ClipboardList,
  CalendarDays,
  Users,
  MessageSquare,
  Wallet,
  Star,
  Settings,
} from "lucide-react";
import type { DashboardNavItem } from "@/components/dashboard/DashboardNav";

export const vendorDashboardNav: DashboardNavItem[] = [
  { href: "/vendor/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/vendor/dashboard/profile", label: "Profile", icon: User },
  { href: "/vendor/dashboard/services", label: "Services", icon: Wrench },
  { href: "/vendor/dashboard/packages", label: "Packages", icon: Package },
  { href: "/vendor/dashboard/bookings", label: "Bookings", icon: ClipboardList },
  { href: "/vendor/dashboard/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/vendor/dashboard/customers", label: "Customers", icon: Users },
  { href: "/vendor/dashboard/messages", label: "Messages", icon: MessageSquare },
  { href: "/vendor/dashboard/earnings", label: "Earnings", icon: Wallet },
  { href: "/vendor/dashboard/reviews", label: "Reviews", icon: Star },
  { href: "/vendor/dashboard/settings", label: "Settings", icon: Settings },
];
