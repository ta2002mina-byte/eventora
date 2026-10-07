"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Bell, Sparkles } from "lucide-react";
import { DashboardNavLinks, dashboardNav } from "@/components/dashboard/DashboardNav";
import type { DashboardNavItem } from "@/components/dashboard/DashboardNav";
import { vendorDashboardNav } from "@/components/vendor-dashboard/VendorDashboardNav";
import { ProfileMenu } from "@/components/dashboard/ProfileMenu";

function currentTitle(pathname: string, items: DashboardNavItem[], fallback: string) {
  const match = [...items]
    .sort((a, b) => b.href.length - a.href.length)
    .find((i) => pathname === i.href || pathname.startsWith(`${i.href}/`));
  return match?.label ?? fallback;
}

function Brand({ onClick, href = "/" }: { onClick?: () => void; href?: string }) {
  return (
    <Link href={href} onClick={onClick} className="flex items-center gap-2">
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-700 text-warmwhite">
        <Sparkles className="h-4 w-4" />
      </span>
      <span className="font-display text-lg font-medium text-charcoal">Eventora</span>
    </Link>
  );
}

export function DashboardShell({
  email,
  notificationCount,
  children,
  navBase = "customer",
  messageBadge = 0,
  defaultTitle = "Dashboard",
  notificationsHref = "/dashboard/notifications",
  profileMenuLinks,
  isAdmin = false,
}: {
  email: string;
  notificationCount: number;
  children: React.ReactNode;
  /** Which sidebar to render. Defaults to the customer dashboard. */
  navBase?: "customer" | "vendor";
  /** Unread message count to badge onto the Messages nav item. */
  messageBadge?: number;
  defaultTitle?: string;
  notificationsHref?: string;
  profileMenuLinks?: { dashboardHref: string; settingsHref: string };
  /** Show the "Admin panel" shortcut in the profile menu. */
  isAdmin?: boolean;
}) {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const pathname = usePathname() ?? "/dashboard";
  const baseItems = navBase === "vendor" ? vendorDashboardNav : dashboardNav;
  const items: DashboardNavItem[] = React.useMemo(
    () =>
      messageBadge > 0
        ? baseItems.map((item) =>
            item.label === "Messages" ? { ...item, badge: messageBadge } : item
          )
        : baseItems,
    [baseItems, messageBadge]
  );
  const title = currentTitle(pathname, items, defaultTitle);

  // Close the mobile drawer whenever the route changes.
  React.useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-warmwhite lg:grid lg:grid-cols-[16rem_1fr]">
      {/* Desktop sidebar */}
      <aside className="hidden border-r border-border bg-white lg:flex lg:flex-col">
        <div className="flex h-16 items-center border-b border-border px-5">
          <Brand />
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          <DashboardNavLinks items={items} />
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-charcoal/40"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85%] flex-col bg-white shadow-soft">
            <div className="flex h-16 items-center justify-between border-b border-border px-5">
              <Brand onClick={() => setMobileOpen(false)} />
              <button
                aria-label="Close menu"
                onClick={() => setMobileOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full text-charcoal-600 hover:bg-purple-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              <DashboardNavLinks items={items} onNavigate={() => setMobileOpen(false)} />
            </div>
          </div>
        </div>
      )}

      <div className="flex min-h-screen flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-3 border-b border-border bg-warmwhite/90 px-4 backdrop-blur sm:px-6">
          <div className="flex items-center gap-2">
            <button
              aria-label="Open menu"
              onClick={() => setMobileOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-full text-charcoal-600 hover:bg-purple-50 lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-lg font-medium text-charcoal">{title}</h1>
          </div>

          <div className="flex items-center gap-1.5">
            <Link
              href={notificationsHref}
              aria-label="Notifications"
              className="relative flex h-10 w-10 items-center justify-center rounded-full text-charcoal-600 hover:bg-purple-50 hover:text-purple-700"
            >
              <Bell className="h-4 w-4" />
              {notificationCount > 0 && (
                <span className="absolute right-2 top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-purple-700 px-1 text-[10px] font-semibold text-warmwhite">
                  {notificationCount}
                </span>
              )}
            </Link>
            <ProfileMenu email={email} links={profileMenuLinks} isAdmin={isAdmin} />
          </div>
        </header>

        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
