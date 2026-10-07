# Eventora

All-in-one event management platform — Next.js App Router + TypeScript +
Tailwind + Supabase. Built one phase at a time; see each phase's status below.

## Setup

```bash
npm install
cp .env.local.example .env.local
# fill in NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
# and SUPABASE_SERVICE_ROLE_KEY from your Supabase project settings
```

Apply the database migrations (Supabase SQL editor, in order, or `supabase db push`):

```
supabase/migrations/0001_events_marketplace.sql
supabase/migrations/0002_venue_marketplace.sql
supabase/migrations/0003_vendor_marketplace.sql
supabase/migrations/0004_event_creation_ai_planner.sql
supabase/migrations/0005_guests_budget.sql
... through ...
supabase/migrations/0011_admin_panel.sql
supabase/migrations/0012_registration_gate.sql
```

Then:

```bash
npm run dev
npm run typecheck   # TypeScript
npm run lint        # ESLint
npm run build       # Production build
```

> This project is generated in a sandbox without npm registry access, so
> dependencies have not been installed or build-verified there. Run the
> three commands above locally after `npm install` and report anything
> your exact dependency versions surface.

## Phase 01 — Foundation + Design System ✅

- Next.js 14 App Router + TypeScript (strict), Tailwind with Eventora
  design tokens (Deep Purple / Soft Lavender / Champagne Gold / Warm
  White / Charcoal), Fraunces (display) + Inter (body)
- Supabase browser client, server client (+ server-only admin client),
  and middleware session refresh (`lib/supabase/*`)
- 20-component UI kit in `components/ui/`
- Route scaffolding for every route in the master spec
- Project structure: `app/ components/ lib/ hooks/ types/ services/ public/`

## Phase 02 — Homepage ✅

- Sticky `Header` (nav, search, sign in/get started, mobile menu) and
  `Footer`, both mounted once in `app/layout.tsx` so every route shares them
- Full homepage (`app/page.tsx`): hero, category grid, featured
  events/venues/vendors, How It Works, planning features, AI Planner
  promo, testimonials, closing CTA
- Homepage content now comes from the database and the admin panel (see Phase 12).

## Phase 03 — Events Marketplace ✅

- `/events` — search (debounced), category/city/date/price filters,
  sorting, pagination, responsive grid; empty state when nothing matches
- `/events/[id]` — gallery band, description, schedule, ticket types
  with live availability, venue, save/share/add-to-calendar, "Get
  Tickets" (checkout itself arrives in the Booking & Payment phase);
  `not-found.tsx` for an invalid id/slug, `error.tsx` + `loading.tsx`
  for the async states
- Tables: `event_categories`, `events`, `event_schedules`,
  `event_ticket_types`, `favorites` — see
  `supabase/migrations/0001_events_marketplace.sql`.
  **Naming note:** the phase brief calls this table "tickets", but that
  name is reused by Phase 10 for *issued* (post-payment) tickets, so
  Phase 03's ticket *types/pricing tiers* are modeled as
  `event_ticket_types` to avoid a collision.
- RLS: published + public events (and their schedules/ticket types) are
  readable by anyone; organizers can always read/write their own events;
  favorites are private to the owning user
- `toggleFavorite` (`app/events/actions.ts`) is a Server Action —
  requires auth, enforced both in the action and by RLS
- No sample events are seeded (only categories) — there's no event
  creation UI until Phase 06, so `/events` will show its empty state
  until you insert rows manually or via the SQL editor

## Supabase notes

- `lib/supabase/client.ts` — Client Components (`"use client"`)
- `lib/supabase/server.ts` — Server Components / Route Handlers / Server
  Actions; also exports `createAdminClient()` (service role key,
  **server-only**, never imported into a Client Component)
- `middleware.ts` + `lib/supabase/middleware.ts` — refreshes the auth
  session cookie on every request
- `lib/auth.ts` — `getCurrentUser()` server helper

## Design tokens (Tailwind)

| Token        | Hex       | Usage                     |
|--------------|-----------|---------------------------|
| purple.700   | `#3B1E6B` | Deep Purple — primary     |
| lavender.300 | `#C9BEEA` | Soft Lavender — secondary |
| gold.400     | `#C9A567` | Champagne Gold — accent   |
| warmwhite    | `#FBF8F3` | Background                |
| charcoal     | `#241F2E` | Text                      |
| border       | `#E5E0EA` | Borders                   |

## Phase 07 — Guest + Budget Management ✅

- `/dashboard/events/[id]/guests` — add/edit/delete guests, search,
  RSVP filter (Pending/Invited/Confirmed/Declined) and group filter,
  inline RSVP change, meal preference, plus-one, notes, and a seating
  "Tables" manager (create/remove tables, capacity, live seated count)
- `/dashboard/events/[id]/budget` — editable total budget, categorized
  planned vs. actual expenses (add/edit/delete, mark paid/unpaid,
  optional vendor association), summary cards (Total/Planned/Actual/
  Remaining) with an over-budget warning, and a by-category breakdown
- New shared `EventSectionNav` tabs (Overview / Planner / AI Planner /
  Guests / Budget) wired into all five event-scoped pages
- AI integration: the AI Planner's **Add Budget** action now also
  seeds `event_budget` + categorized `budget_expenses` rows (not just
  the legacy `events.budget` total); the Budget page shows a banner
  linking back to the AI Planner whenever a plan hasn't been applied yet
- `event.guest_count` / `event.budget` summary cards on the Overview
  and Planner pages now show real, live guest and budget data instead
  of the Phase 06 "arrives in Phase 07" placeholders
- New tables: `guests`, `guest_tables`, `event_budget`,
  `budget_expenses` — all RLS-scoped to the owning event's organizer

## Phase 11 — Messages + Reviews ✅

- `/dashboard/messages`, `/dashboard/messages/[conversationId]`,
  `/vendor/dashboard/messages(/[conversationId])` — a shared inbox
  (search, unread badges, two-pane layout) and thread view (send,
  Supabase Realtime with a polling fallback, day separators,
  attachment UI placeholder) reused across the customer and vendor
  dashboards
- "Message Vendor" / "Message Venue" / "Message Organizer" entry
  points on the vendor, venue and event detail pages start (or
  reuse) a conversation via the new `start_conversation` RPC
- "Write a review" on vendor/venue/event detail pages and a new
  `/dashboard/reviews` ("My Reviews") page to edit/delete your own
  reviews — gated by a completed booking, enforced both in the UI and
  by RLS (`has_completed_{vendor,venue,event}_booking`)
- New tables: `conversations`, `conversation_participants`,
  `messages`, `message_attachments`, `event_reviews`
- `vendor_reviews` / `venue_reviews` gained `status` (moderation) and
  `updated_at` columns; their Phase 04/05 permissive "manage your own
  reviews" policy is now split into insert (eligibility-gated) /
  update / delete, per the note left in those migrations
- `vendors.rating_avg`/`rating_count`, `venues.rating_avg`/
  `rating_count` and the new `events.rating_avg`/`rating_count` are
  now kept in sync automatically by a `refresh_rating_aggregate`
  trigger on each reviews table (previously these were seeded once
  and never recalculated)

## Phase 12 — Admin Panel ✅

Open `/admin`. Access is checked on the server on every page and action
(service-role reads; the browser is never trusted).

**First admin:** set `ADMIN_EMAILS=you@example.com` in `.env.local`, sign in
with that (email-confirmed) account and open `/admin` — it is promoted
automatically. More admins can be made from **Users**.

What you can control from the panel:

| Area | What it controls |
|------|------------------|
| Dashboard | Live counts, revenue, items needing attention |
| Events / Venues / Vendors | Create, edit, publish/unpublish, feature on homepage, owner, images, schedule, ticket types, services, packages, portfolio, delete |
| Categories | Event categories (also shown on the homepage) |
| Ticket orders / Payments / Issued tickets | View, mark paid, cancel (+refund), complete |
| Venue & vendor requests | View and delete booking/quote requests |
| Users | Roles (customer / vendor / admin), suspend / unsuspend, delete |
| Reviews | Hide / publish / delete event, vendor and venue reviews |
| Contact inbox | Read, mark replied/archived, private notes, reply by email |
| Testimonials | Homepage quotes: add, order, publish, delete |
| Site settings | Site name/SEO, footer, contact & social links, every homepage section (text + show/hide), pricing plans, maintenance mode, sign-up on/off |
| Menus & links | Top navigation and footer link columns |
| Privacy & Terms | Text of the `/privacy` and `/terms` pages (starter template included — have it reviewed before launch) |
| Audit log | Every admin change (who, what, when) |

Notes:
- Run `0011_admin_panel.sql` and `0012_registration_gate.sql`. Until 0011 is
  applied the site falls back to its built-in text.
- Maintenance mode shows a maintenance page to everyone except admins;
  `/admin`, `/auth` and `/api` keep working so you can switch it back off
  and payment callbacks still arrive.
- "Allow new sign-ups" hides the Register page *and* (via 0012) blocks
  account creation in the database.
- Homepage "Featured" sections show items flagged **Featured** in the panel;
  if none are flagged yet they show the newest published ones.

## Next phase

Phase 13 — Final Responsive + Production Polish. Do not start it
automatically; review this phase first.
