-- ============================================================
-- Phase 03 — Events Marketplace
-- Run this in the Supabase SQL editor (or via `supabase db push`).
-- ============================================================

-- Note on naming: the phase brief lists a "tickets" table for
-- Phase 03. That name is reused by Phase 10 for *issued* tickets
-- (post-payment, with a QR code). To avoid a collision, Phase 03's
-- "tickets" concept — the ticket types/pricing tiers an organizer
-- sells for an event (e.g. "General", "VIP") — is modeled here as
-- `event_ticket_types`. Phase 10 will add `tickets` / `ticket_items`
-- for the actual purchased/issued tickets.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------
-- event_categories
-- ---------------------------------------------------------------
create table if not exists public.event_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  icon text not null default 'Sparkles', -- lucide-react icon name
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------
-- events
-- ---------------------------------------------------------------
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  organizer_id uuid references auth.users (id) on delete set null,
  category_id uuid references public.event_categories (id) on delete set null,

  title text not null,
  slug text not null unique,
  description text,
  cover_image_url text,

  organizer_name text, -- denormalized display name until Phase 08 profiles

  start_date date not null,
  end_date date,
  start_time time,
  end_time time,

  location_name text,
  location_address text,
  city text,

  -- Denormalized from event_ticket_types so the marketplace can
  -- filter/sort by price without an aggregate join on every request.
  -- Kept in sync by the app when ticket types are created/edited.
  starting_price numeric(12, 2) not null default 0,
  currency text not null default 'BDT',

  status text not null default 'published' check (status in ('draft', 'published', 'cancelled')),
  visibility text not null default 'public' check (visibility in ('public', 'private')),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists events_status_start_date_idx on public.events (status, start_date);
create index if not exists events_category_id_idx on public.events (category_id);
create index if not exists events_city_idx on public.events (city);

-- ---------------------------------------------------------------
-- event_schedules (per-event agenda / run-of-show items)
-- ---------------------------------------------------------------
create table if not exists public.event_schedules (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  title text not null,
  description text,
  start_time time,
  end_time time,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists event_schedules_event_id_idx on public.event_schedules (event_id);

-- ---------------------------------------------------------------
-- event_ticket_types (pricing tiers — see naming note above)
-- ---------------------------------------------------------------
create table if not exists public.event_ticket_types (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  name text not null,
  description text,
  price numeric(12, 2) not null default 0,
  quantity_total int not null default 0,
  quantity_sold int not null default 0,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists event_ticket_types_event_id_idx on public.event_ticket_types (event_id);

-- ---------------------------------------------------------------
-- favorites (saved events, per authenticated user)
-- ---------------------------------------------------------------
create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  event_id uuid not null references public.events (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, event_id)
);

create index if not exists favorites_user_id_idx on public.favorites (user_id);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.event_categories enable row level security;
alter table public.events enable row level security;
alter table public.event_schedules enable row level security;
alter table public.event_ticket_types enable row level security;
alter table public.favorites enable row level security;

-- Categories: readable by anyone (no user data involved).
create policy "categories are publicly readable"
  on public.event_categories for select
  using (true);

-- Events: public + published events are readable by anyone.
-- Organizers can always read/write their own events (draft included).
create policy "published public events are readable by anyone"
  on public.events for select
  using (status = 'published' and visibility = 'public');

create policy "organizers can read their own events"
  on public.events for select
  using (auth.uid() = organizer_id);

create policy "organizers can insert their own events"
  on public.events for insert
  with check (auth.uid() = organizer_id);

create policy "organizers can update their own events"
  on public.events for update
  using (auth.uid() = organizer_id)
  with check (auth.uid() = organizer_id);

create policy "organizers can delete their own events"
  on public.events for delete
  using (auth.uid() = organizer_id);

-- Schedules / ticket types: readable whenever the parent event is
-- readable; writable only by that event's organizer.
create policy "schedules readable when parent event is readable"
  on public.event_schedules for select
  using (
    exists (
      select 1 from public.events e
      where e.id = event_schedules.event_id
        and (
          (e.status = 'published' and e.visibility = 'public')
          or e.organizer_id = auth.uid()
        )
    )
  );

create policy "organizers manage their own event schedules"
  on public.event_schedules for all
  using (
    exists (
      select 1 from public.events e
      where e.id = event_schedules.event_id and e.organizer_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.events e
      where e.id = event_schedules.event_id and e.organizer_id = auth.uid()
    )
  );

create policy "ticket types readable when parent event is readable"
  on public.event_ticket_types for select
  using (
    exists (
      select 1 from public.events e
      where e.id = event_ticket_types.event_id
        and (
          (e.status = 'published' and e.visibility = 'public')
          or e.organizer_id = auth.uid()
        )
    )
  );

create policy "organizers manage their own event ticket types"
  on public.event_ticket_types for all
  using (
    exists (
      select 1 from public.events e
      where e.id = event_ticket_types.event_id and e.organizer_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.events e
      where e.id = event_ticket_types.event_id and e.organizer_id = auth.uid()
    )
  );

-- Favorites: strictly private to the owning user.
create policy "users can read their own favorites"
  on public.favorites for select
  using (auth.uid() = user_id);

create policy "users can add their own favorites"
  on public.favorites for insert
  with check (auth.uid() = user_id);

create policy "users can remove their own favorites"
  on public.favorites for delete
  using (auth.uid() = user_id);

-- ============================================================
-- Seed: starter categories (safe to re-run)
-- ============================================================
insert into public.event_categories (name, slug, icon, sort_order) values
  ('Weddings', 'weddings', 'Heart', 1),
  ('Corporate', 'corporate', 'Briefcase', 2),
  ('Birthdays', 'birthdays', 'Cake', 3),
  ('Concerts', 'concerts', 'Music', 4),
  ('Conferences', 'conferences', 'Presentation', 5),
  ('Graduations', 'graduations', 'GraduationCap', 6)
on conflict (slug) do nothing;
