-- ============================================================
-- Phase 07 — Guest + Budget Management
-- Run this in the Supabase SQL editor (or via `supabase db push`).
-- ============================================================

-- ---------------------------------------------------------------
-- guest_tables — seating tables for an event
-- ---------------------------------------------------------------
create table if not exists public.guest_tables (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  name text not null,
  capacity int not null default 8 check (capacity > 0),
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists guest_tables_event_id_idx on public.guest_tables (event_id);

-- ---------------------------------------------------------------
-- guests
-- ---------------------------------------------------------------
create table if not exists public.guests (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,

  name text not null,
  email text,
  phone text,

  group_name text, -- e.g. "Bride's family", "College friends"
  rsvp_status text not null default 'pending' check (
    rsvp_status in ('pending', 'invited', 'confirmed', 'declined')
  ),
  meal_preference text,
  plus_one boolean not null default false,
  plus_one_name text,

  table_id uuid references public.guest_tables (id) on delete set null,

  notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists guests_event_id_idx on public.guests (event_id);
create index if not exists guests_event_id_rsvp_idx on public.guests (event_id, rsvp_status);
create index if not exists guests_table_id_idx on public.guests (table_id);

-- ---------------------------------------------------------------
-- event_budget — one settings/summary row per event
-- ---------------------------------------------------------------
create table if not exists public.event_budget (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null unique references public.events (id) on delete cascade,
  total_amount numeric(12, 2) not null default 0,
  currency text not null default 'BDT',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------
-- budget_expenses — categorized planned/actual line items
-- ---------------------------------------------------------------
create table if not exists public.budget_expenses (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,

  category text not null,
  title text not null,
  planned_amount numeric(12, 2) not null default 0,
  actual_amount numeric(12, 2) not null default 0,
  is_paid boolean not null default false,

  -- Optional link to a marketplace vendor this expense is associated with.
  vendor_id uuid references public.vendors (id) on delete set null,

  notes text,
  source text not null default 'manual' check (source in ('manual', 'ai')),
  sort_order int not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists budget_expenses_event_id_idx on public.budget_expenses (event_id);
create index if not exists budget_expenses_event_id_category_idx on public.budget_expenses (event_id, category);
create index if not exists budget_expenses_vendor_id_idx on public.budget_expenses (vendor_id);

-- ============================================================
-- Row Level Security — private to the owning event's organizer
-- ============================================================

alter table public.guest_tables enable row level security;
alter table public.guests enable row level security;
alter table public.event_budget enable row level security;
alter table public.budget_expenses enable row level security;

create policy "organizers manage their own guest tables"
  on public.guest_tables for all
  using (
    exists (
      select 1 from public.events e
      where e.id = guest_tables.event_id and e.organizer_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.events e
      where e.id = guest_tables.event_id and e.organizer_id = auth.uid()
    )
  );

create policy "organizers manage their own guests"
  on public.guests for all
  using (
    exists (
      select 1 from public.events e
      where e.id = guests.event_id and e.organizer_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.events e
      where e.id = guests.event_id and e.organizer_id = auth.uid()
    )
  );

create policy "organizers manage their own event budget"
  on public.event_budget for all
  using (
    exists (
      select 1 from public.events e
      where e.id = event_budget.event_id and e.organizer_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.events e
      where e.id = event_budget.event_id and e.organizer_id = auth.uid()
    )
  );

create policy "organizers manage their own budget expenses"
  on public.budget_expenses for all
  using (
    exists (
      select 1 from public.events e
      where e.id = budget_expenses.event_id and e.organizer_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.events e
      where e.id = budget_expenses.event_id and e.organizer_id = auth.uid()
    )
  );
