-- ============================================================
-- Phase 06 — Event Creation + AI Event Planner
-- Run this in the Supabase SQL editor (or via `supabase db push`).
-- ============================================================

-- Note on reuse: Phase 03 already modeled `public.events` with an
-- `organizer_id`, `status` ('draft' | 'published' | 'cancelled') and
-- `visibility` ('public' | 'private') — exactly what a customer's own
-- "planning" event needs (private, draft, owned by them). Rather than
-- create a second events table, Phase 06 extends the existing one
-- with the extra fields a personal event needs, and reuses the RLS
-- policies already in place ("organizers can read/insert/update/
-- delete their own events").

-- ---------------------------------------------------------------
-- events — add Event Creation + planner fields
-- ---------------------------------------------------------------
alter table public.events
  add column if not exists event_type text,
  add column if not exists guest_count int,
  add column if not exists budget numeric(12, 2),
  add column if not exists theme text,
  add column if not exists notes text;

comment on column public.events.event_type is
  'Freeform/enum-ish event type, e.g. wedding, birthday, corporate (Create Event + AI Planner).';
comment on column public.events.guest_count is 'Planned guest count, set on Create Event or by the AI Planner.';
comment on column public.events.budget is 'Total planned budget for this event (BDT by default, see currency).';
comment on column public.events.theme is 'Optional theme/style, used by the AI Planner.';
comment on column public.events.notes is 'Freeform organizer notes captured on Create Event.';

-- ---------------------------------------------------------------
-- event_tasks — planner checklist / timeline items
-- ---------------------------------------------------------------
create table if not exists public.event_tasks (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  title text not null,
  notes text,
  due_date date,
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  assignee text,
  is_complete boolean not null default false,
  source text not null default 'manual' check (source in ('manual', 'ai')),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists event_tasks_event_id_idx on public.event_tasks (event_id);
create index if not exists event_tasks_event_id_due_date_idx on public.event_tasks (event_id, due_date);

-- ---------------------------------------------------------------
-- ai_event_plans — one row per AI Event Planner generation
-- ---------------------------------------------------------------
create table if not exists public.ai_event_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  event_id uuid references public.events (id) on delete set null,

  -- Inputs the plan was generated from.
  event_type text not null,
  location text,
  guest_count int,
  budget numeric(12, 2),
  event_date date,
  theme text,
  venue_preference text,
  requirements text,
  notes text,

  -- Output.
  provider text not null default 'rule-based',
  overview text not null,
  result jsonb not null, -- full structured AiPlanResult (budget/checklist/timeline/etc.)

  budget_applied_at timestamptz,
  tasks_applied_at timestamptz,

  created_at timestamptz not null default now()
);

create index if not exists ai_event_plans_user_id_idx on public.ai_event_plans (user_id);
create index if not exists ai_event_plans_event_id_idx on public.ai_event_plans (event_id);

-- ---------------------------------------------------------------
-- ai_plan_items — normalized line items from a plan (budget rows,
-- checklist/timeline rows) so they can be selectively applied to a
-- real event (event_tasks, event budget) and tracked.
-- ---------------------------------------------------------------
create table if not exists public.ai_plan_items (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.ai_event_plans (id) on delete cascade,
  category text not null check (
    category in ('budget', 'checklist', 'timeline', 'guest_checklist', 'task')
  ),
  title text not null,
  description text,
  amount numeric(12, 2),
  percentage numeric(5, 2),
  due_date date,
  sort_order int not null default 0,
  applied boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists ai_plan_items_plan_id_idx on public.ai_plan_items (plan_id);

-- ---------------------------------------------------------------
-- ai_recommendations — venue/vendor recommendation structure from a
-- plan (categories + search criteria; not bookings themselves).
-- ---------------------------------------------------------------
create table if not exists public.ai_recommendations (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.ai_event_plans (id) on delete cascade,
  kind text not null check (kind in ('venue', 'vendor')),
  category text not null, -- venue type, or vendor category slug
  title text not null,
  description text,
  criteria jsonb not null default '{}'::jsonb, -- e.g. { city, minCapacity, maxPrice }
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists ai_recommendations_plan_id_idx on public.ai_recommendations (plan_id);

-- ---------------------------------------------------------------
-- Link venue/vendor booking requests to a dashboard event (optional).
-- Nullable + ON DELETE SET NULL so this never breaks Phase 04/05.
-- ---------------------------------------------------------------
alter table public.venue_bookings
  add column if not exists event_id uuid references public.events (id) on delete set null;
create index if not exists venue_bookings_event_id_idx on public.venue_bookings (event_id);

alter table public.vendor_bookings
  add column if not exists event_id uuid references public.events (id) on delete set null;
create index if not exists vendor_bookings_event_id_idx on public.vendor_bookings (event_id);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.event_tasks enable row level security;
alter table public.ai_event_plans enable row level security;
alter table public.ai_plan_items enable row level security;
alter table public.ai_recommendations enable row level security;

-- event_tasks: only the owning event's organizer.
create policy "organizers manage their own event tasks"
  on public.event_tasks for all
  using (
    exists (
      select 1 from public.events e
      where e.id = event_tasks.event_id and e.organizer_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.events e
      where e.id = event_tasks.event_id and e.organizer_id = auth.uid()
    )
  );

-- ai_event_plans: strictly private to the user who generated them.
create policy "users manage their own ai event plans"
  on public.ai_event_plans for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ai_plan_items / ai_recommendations: readable/writable when the
-- parent plan belongs to the current user.
create policy "users manage their own ai plan items"
  on public.ai_plan_items for all
  using (
    exists (
      select 1 from public.ai_event_plans p
      where p.id = ai_plan_items.plan_id and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.ai_event_plans p
      where p.id = ai_plan_items.plan_id and p.user_id = auth.uid()
    )
  );

create policy "users manage their own ai recommendations"
  on public.ai_recommendations for all
  using (
    exists (
      select 1 from public.ai_event_plans p
      where p.id = ai_recommendations.plan_id and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.ai_event_plans p
      where p.id = ai_recommendations.plan_id and p.user_id = auth.uid()
    )
  );
