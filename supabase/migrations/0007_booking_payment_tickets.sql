-- ============================================================
-- Phase 10 — Booking + Payment + Tickets
-- Run this in the Supabase SQL editor (or via `supabase db push`).
-- ============================================================

-- Scope note: "booking" here means purchasing tickets to a public
-- marketplace event (Phase 03's `events` + `event_ticket_types`) —
-- the flow the event detail page's "Get Tickets" button already
-- links to (/booking/[eventId]). Venue/vendor quote requests from
-- Phase 04/05 (`venue_bookings` / `vendor_bookings`) are a separate,
-- already-working flow and are untouched here.

-- ---------------------------------------------------------------
-- bookings — one row per checkout/order against an event
-- ---------------------------------------------------------------
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  event_id uuid not null references public.events (id) on delete cascade,

  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'cancelled', 'completed')),

  customer_name text not null,
  customer_email text not null,
  customer_phone text,
  notes text,

  subtotal numeric(12, 2) not null default 0,
  currency text not null default 'BDT',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists bookings_user_id_idx on public.bookings (user_id);
create index if not exists bookings_event_id_idx on public.bookings (event_id);
create index if not exists bookings_status_idx on public.bookings (status);

-- ---------------------------------------------------------------
-- ticket_items — line items within a booking (ticket type + qty).
-- Name/price are denormalized at time of purchase so a later price
-- change on event_ticket_types never rewrites historical orders.
-- ticket_type_id is nullable to support events with no configured
-- ticket tiers (a single "General Admission" line at the event's
-- starting_price).
-- ---------------------------------------------------------------
create table if not exists public.ticket_items (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings (id) on delete cascade,
  ticket_type_id uuid references public.event_ticket_types (id) on delete set null,
  name text not null,
  unit_price numeric(12, 2) not null default 0,
  quantity int not null check (quantity > 0),
  subtotal numeric(12, 2) not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists ticket_items_booking_id_idx on public.ticket_items (booking_id);

-- ---------------------------------------------------------------
-- payments — one row per payment attempt against a booking.
-- Never stores card numbers, CVV or any raw payment credentials —
-- see services/payments/ for the provider abstraction. `provider`
-- distinguishes the dev/test flow from a future real gateway.
-- ---------------------------------------------------------------
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,

  amount numeric(12, 2) not null default 0,
  currency text not null default 'BDT',
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'failed', 'refunded')),

  provider text not null default 'dev',
  provider_reference text,
  card_last4 text, -- last 4 digits only, for the receipt — never a full PAN

  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists payments_booking_id_idx on public.payments (booking_id);
create index if not exists payments_user_id_idx on public.payments (user_id);

-- ---------------------------------------------------------------
-- tickets — individual issued/holder-facing tickets, one row per
-- attendee (a ticket_items row with quantity 3 issues 3 tickets),
-- created once a booking's payment is confirmed.
-- ---------------------------------------------------------------
create table if not exists public.tickets (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings (id) on delete cascade,
  ticket_item_id uuid not null references public.ticket_items (id) on delete cascade,
  event_id uuid not null references public.events (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,

  ticket_code text not null unique, -- encoded into the QR area
  ticket_type_name text not null,
  holder_name text not null,
  holder_email text not null,

  status text not null default 'valid' check (status in ('valid', 'used', 'cancelled')),
  issued_at timestamptz not null default now(),
  checked_in_at timestamptz
);

create index if not exists tickets_user_id_idx on public.tickets (user_id);
create index if not exists tickets_booking_id_idx on public.tickets (booking_id);
create index if not exists tickets_event_id_idx on public.tickets (event_id);

-- ============================================================
-- Row Level Security — a user only ever sees their own
-- bookings/payments/tickets (never another user's private data).
-- ============================================================

alter table public.bookings enable row level security;
alter table public.ticket_items enable row level security;
alter table public.payments enable row level security;
alter table public.tickets enable row level security;

create policy "users manage their own bookings"
  on public.bookings for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users manage their own ticket items"
  on public.ticket_items for all
  using (
    exists (
      select 1 from public.bookings b
      where b.id = ticket_items.booking_id and b.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.bookings b
      where b.id = ticket_items.booking_id and b.user_id = auth.uid()
    )
  );

create policy "users view and create their own payments"
  on public.payments for select
  using (auth.uid() = user_id);

create policy "users insert their own payments"
  on public.payments for insert
  with check (auth.uid() = user_id);

-- Payment status transitions (pending -> paid/failed) are performed
-- server-side via the admin client alongside the ticket_types
-- availability check (see app/checkout/[id]/actions.ts), since a
-- customer must never be able to mark their own payment "paid".

create policy "users view their own tickets"
  on public.tickets for select
  using (auth.uid() = user_id);

-- Tickets are only ever inserted by the server (admin client) once
-- a payment is confirmed — no insert/update policy for regular users.
