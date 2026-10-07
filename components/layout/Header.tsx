"use client";

import * as React from "react";
import Link from "next/link";
import { Menu, X, Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SearchBar } from "@/components/ui/SearchBar";
import { cn } from "@/lib/utils";

const defaultNavLinks = [
  { href: "/events", label: "Events" },
  { href: "/venues", label: "Venues" },
  { href: "/vendors", label: "Vendors" },
  { href: "/ai-planner", label: "AI Planner" },
  { href: "/pricing", label: "Pricing" },
  { href: "/contact", label: "Contact" },
];

export function Header({ siteName = "Eventora", links }: { siteName?: string; links?: { label: string; href: string }[] }) {
  const navLinks = links ?? defaultNavLinks;
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-warmwhite/90 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-700 text-warmwhite">
            <Sparkles className="h-4 w-4" />
          </span>
          <span className="font-display text-lg font-medium text-charcoal">{siteName}</span>
        </Link>

        <nav aria-label="Primary" className="hidden lg:flex lg:items-center lg:gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-pill px-3.5 py-2 text-sm text-charcoal-600 transition-colors hover:bg-purple-50 hover:text-purple-700"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {searchOpen ? (
            <div className="w-64">
              <SearchBar
                value={query}
                onChange={setQuery}
                onSubmit={() => setSearchOpen(false)}
                placeholder="Search events, venues, vendors"
                aria-label="Search Eventora"
              />
            </div>
          ) : (
            <button
              aria-label="Open search"
              onClick={() => setSearchOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-full text-charcoal-600 hover:bg-purple-50 hover:text-purple-700"
            >
              <Search className="h-4 w-4" />
            </button>
          )}
          <Link href="/auth/login">
            <Button variant="ghost" size="sm">
              Sign In
            </Button>
          </Link>
          <Link href="/auth/register">
            <Button size="sm">Get Started</Button>
          </Link>
        </div>

        <button
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((o) => !o)}
          className="flex h-10 w-10 items-center justify-center rounded-full text-charcoal-600 hover:bg-purple-50 lg:hidden"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <div
        className={cn(
          "overflow-hidden border-t border-border bg-warmwhite transition-[max-height] duration-200 lg:hidden",
          mobileOpen ? "max-h-[28rem]" : "max-h-0 border-t-0"
        )}
      >
        <div className="container-page flex flex-col gap-1 py-4">
          <div className="mb-2">
            <SearchBar
              value={query}
              onChange={setQuery}
              placeholder="Search events, venues, vendors"
              aria-label="Search Eventora"
            />
          </div>
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm text-charcoal-600 hover:bg-purple-50 hover:text-purple-700"
            >
              {link.label}
            </Link>
          ))}
          <div className="mt-2 flex gap-2">
            <Link href="/auth/login" className="flex-1">
              <Button variant="outline" size="sm" className="w-full">
                Sign In
              </Button>
            </Link>
            <Link href="/auth/register" className="flex-1">
              <Button size="sm" className="w-full">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
