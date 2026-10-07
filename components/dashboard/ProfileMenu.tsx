"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronDown, LogOut, Settings, Shield, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "@/app/dashboard/actions";

export function ProfileMenu({
  email,
  links,
  isAdmin = false,
}: {
  email: string;
  isAdmin?: boolean;
  links?: { dashboardHref: string; settingsHref: string };
}) {
  const dashboardHref = links?.dashboardHref ?? "/dashboard";
  const settingsHref = links?.settingsHref ?? "/dashboard/settings";
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const initial = email.charAt(0).toUpperCase();

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account menu for ${email}`}
        className="flex items-center gap-2 rounded-pill py-1 pl-1 pr-2 text-sm text-charcoal-600 transition-colors hover:bg-purple-50"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-700 text-sm font-medium text-warmwhite">
          {initial}
        </span>
        <ChevronDown className="h-4 w-4" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-card border border-border bg-white shadow-soft"
        >
          <div className="border-b border-border px-4 py-3">
            <p className="text-xs text-charcoal-400">Signed in as</p>
            <p className="truncate text-sm font-medium text-charcoal">{email}</p>
          </div>
          <div className="p-1.5">
            <Link
              href={dashboardHref}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-charcoal-600 hover:bg-purple-50 hover:text-purple-700"
            >
              <User className="h-4 w-4" /> My dashboard
            </Link>
            <Link
              href={settingsHref}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-charcoal-600 hover:bg-purple-50 hover:text-purple-700"
            >
              <Settings className="h-4 w-4" /> Settings
            </Link>
            {isAdmin && (
              <Link
                href="/admin"
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-charcoal-600 hover:bg-purple-50 hover:text-purple-700"
              >
                <Shield className="h-4 w-4" /> Admin panel
              </Link>
            )}
          </div>
          <form action={signOut} className="border-t border-border p-1.5">
            <button
              type="submit"
              role="menuitem"
              className={cn(
                "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-red-600",
                "hover:bg-red-50"
              )}
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
