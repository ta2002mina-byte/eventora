"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, CalendarDays, Tags, Building2, Store, ShoppingBag, CreditCard, Ticket,
  ClipboardList, Users, Star, Mail, Quote, Settings, ScrollText, Menu, X, Shield, ExternalLink, LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "@/app/dashboard/actions";

const GROUPS: { title: string; items: { href: string; label: string; icon: React.ComponentType<{ className?: string }> }[] }[] = [
  { title: "Overview", items: [{ href: "/admin", label: "Dashboard", icon: LayoutDashboard }] },
  {
    title: "Marketplace",
    items: [
      { href: "/admin/events", label: "Events", icon: CalendarDays },
      { href: "/admin/categories", label: "Categories", icon: Tags },
      { href: "/admin/venues", label: "Venues", icon: Building2 },
      { href: "/admin/vendors", label: "Vendors", icon: Store },
    ],
  },
  {
    title: "Sales",
    items: [
      { href: "/admin/bookings", label: "Ticket orders", icon: ShoppingBag },
      { href: "/admin/payments", label: "Payments", icon: CreditCard },
      { href: "/admin/tickets", label: "Issued tickets", icon: Ticket },
      { href: "/admin/venue-requests", label: "Venue requests", icon: ClipboardList },
      { href: "/admin/vendor-requests", label: "Vendor requests", icon: ClipboardList },
    ],
  },
  {
    title: "Community",
    items: [
      { href: "/admin/users", label: "Users", icon: Users },
      { href: "/admin/reviews", label: "Reviews", icon: Star },
      { href: "/admin/messages", label: "Contact inbox", icon: Mail },
    ],
  },
  {
    title: "Site",
    items: [
      { href: "/admin/testimonials", label: "Testimonials", icon: Quote },
      { href: "/admin/settings", label: "Site settings", icon: Settings },
    ],
  },
  { title: "System", items: [{ href: "/admin/audit", label: "Audit log", icon: ScrollText }] },
];

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav aria-label="Admin" className="space-y-5">
      {GROUPS.map((g) => (
        <div key={g.title}>
          <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-charcoal-400">{g.title}</p>
          <ul className="space-y-0.5">
            {g.items.map((item) => {
              const active = item.href === "/admin" ? pathname === "/admin" : pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-colors",
                      active ? "bg-purple-700 text-warmwhite" : "text-charcoal-600 hover:bg-purple-50 hover:text-purple-700"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function AdminShell({ email, children }: { email: string; children: React.ReactNode }) {
  const pathname = usePathname() ?? "/admin";
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => setOpen(false), [pathname]);

  return (
    <div className="min-h-screen bg-warmwhite lg:grid lg:grid-cols-[16.5rem_1fr]">
      <aside className="hidden border-r border-border bg-white lg:flex lg:flex-col">
        <div className="flex h-16 items-center gap-2 border-b border-border px-5">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-700 text-warmwhite">
            <Shield className="h-4 w-4" />
          </span>
          <span className="font-display text-lg font-medium text-charcoal">Eventora Admin</span>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          <NavLinks pathname={pathname} />
        </div>
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-charcoal/40" onClick={() => setOpen(false)} aria-hidden="true" />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85%] flex-col bg-white shadow-soft">
            <div className="flex h-16 items-center justify-between border-b border-border px-5">
              <span className="font-display text-lg font-medium">Eventora Admin</span>
              <button aria-label="Close menu" onClick={() => setOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-purple-50">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              <NavLinks pathname={pathname} onNavigate={() => setOpen(false)} />
            </div>
          </div>
        </div>
      )}

      <div className="flex min-h-screen min-w-0 flex-col">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-3 border-b border-border bg-warmwhite/90 px-4 backdrop-blur sm:px-6">
          <button aria-label="Open menu" onClick={() => setOpen(true)} className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-purple-50 lg:hidden">
            <Menu className="h-5 w-5" />
          </button>
          <p className="hidden truncate text-sm text-charcoal-400 sm:block">
            Signed in as <span className="font-medium text-charcoal">{email}</span>
          </p>
          <div className="ml-auto flex items-center gap-1">
            <Link href="/" target="_blank" className="inline-flex items-center gap-1.5 rounded-pill px-3 py-2 text-sm text-charcoal-600 hover:bg-purple-50 hover:text-purple-700">
              <ExternalLink className="h-4 w-4" /> View site
            </Link>
            <Link href="/dashboard" className="hidden rounded-pill px-3 py-2 text-sm text-charcoal-600 hover:bg-purple-50 hover:text-purple-700 sm:inline-flex">
              My dashboard
            </Link>
            <form action={signOut}>
              <button type="submit" className="inline-flex items-center gap-1.5 rounded-pill px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50">
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </form>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      </div>
    </div>
  );
}
