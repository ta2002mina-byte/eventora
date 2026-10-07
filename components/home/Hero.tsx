import Link from "next/link";
import { Sparkles, CalendarCheck, Users, Wallet } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { SiteSettings } from "@/lib/site-settings-defaults";

export function Hero({ home }: { home: SiteSettings["home"] }) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-purple-900 via-purple-700 to-purple-500">
      <div
        className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-lavender-400/30 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-gold-400/20 blur-3xl"
        aria-hidden="true"
      />

      <div className="container-page relative grid items-center gap-12 py-20 lg:grid-cols-2 lg:py-28">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-pill bg-white/10 px-3 py-1 text-xs font-medium text-lavender-100 backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" /> {home.hero_badge}
          </span>
          <h1 className="mt-4 text-4xl leading-tight text-warmwhite sm:text-5xl lg:text-[3.4rem]">
            {home.hero_title_1}
            <br />
            <span className="italic text-gold-300">{home.hero_title_2}</span>
          </h1>
          <p className="mt-5 max-w-md text-lg text-lavender-100">
            {home.hero_subtitle}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/ai-planner">
              <Button
                size="lg"
                className="bg-gold-400 text-purple-900 shadow-soft hover:bg-gold-300"
                leftIcon={<Sparkles className="h-4 w-4" />}
              >
                {home.hero_primary_label}
              </Button>
            </Link>
            <Link href="/events">
              <Button
                size="lg"
                variant="outline"
                className="border-white/30 text-warmwhite hover:bg-white/10"
              >
                {home.hero_secondary_label}
              </Button>
            </Link>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-md">
          <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-gold-300/30 blur-2xl" aria-hidden="true" />

          <div className="rounded-card border border-white/20 bg-white p-5 shadow-soft">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-charcoal">Event Blueprint</p>
              <span className="rounded-pill bg-purple-50 px-2.5 py-1 text-xs font-medium text-purple-700">
                AI Draft
              </span>
            </div>
            <p className="mt-1 text-xs text-charcoal-400">
              500-guest wedding · Dhaka · ৳8,00,000 budget
            </p>

            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-3 rounded-xl bg-lavender-50 p-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-purple-700">
                  <Wallet className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-medium text-charcoal">Budget allocated</p>
                  <p className="text-xs text-charcoal-400">Venue, catering, decor, photography</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl bg-lavender-50 p-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-purple-700">
                  <Users className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-medium text-charcoal">Guest checklist ready</p>
                  <p className="text-xs text-charcoal-400">RSVP tracking &amp; seating</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl bg-lavender-50 p-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-purple-700">
                  <CalendarCheck className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-medium text-charcoal">Timeline drafted</p>
                  <p className="text-xs text-charcoal-400">12 tasks across 6 months</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

