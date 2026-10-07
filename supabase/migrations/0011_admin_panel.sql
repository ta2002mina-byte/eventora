-- ============================================================
-- Phase 12 — Admin Panel
-- Run in the Supabase SQL editor (or `supabase db push`) AFTER 0010.
-- ============================================================

-- ---------------------------------------------------------------
-- profiles: role + suspension
-- ---------------------------------------------------------------
alter table public.profiles
  add column if not exists role text not null default 'customer',
  add column if not exists is_suspended boolean not null default false;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_role_check') then
    alter table public.profiles
      add constraint profiles_role_check check (role in ('customer', 'vendor', 'admin'));
  end if;
end $$;

-- Signed-in users may update their own profile (existing policy), but they
-- must NEVER be able to promote themselves or lift a suspension. Only the
-- service role / SQL editor (auth.uid() is null there) may change these.
create or replace function public.guard_profile_privileged_columns()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if auth.uid() is not null
     and (new.role is distinct from old.role
          or new.is_suspended is distinct from old.is_suspended) then
    raise exception 'role and suspension can only be changed by an administrator';
  end if;
  return new;
end;
$$;

drop trigger if exists guard_profile_privileged_columns on public.profiles;
create trigger guard_profile_privileged_columns
  before update on public.profiles
  for each row execute function public.guard_profile_privileged_columns();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- ---------------------------------------------------------------
-- Homepage "featured" flags (admin-controlled)
-- ---------------------------------------------------------------
alter table public.events  add column if not exists is_featured boolean not null default false;
alter table public.venues  add column if not exists is_featured boolean not null default false;
alter table public.vendors add column if not exists is_featured boolean not null default false;

-- ---------------------------------------------------------------
-- contact_messages: inbox workflow
-- ---------------------------------------------------------------
alter table public.contact_messages
  add column if not exists status text not null default 'new',
  add column if not exists admin_notes text,
  add column if not exists handled_at timestamptz;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'contact_messages_status_check') then
    alter table public.contact_messages
      add constraint contact_messages_status_check
      check (status in ('new', 'read', 'replied', 'archived'));
  end if;
end $$;

-- ---------------------------------------------------------------
-- site_settings — one row per settings group (general, contact, home,
-- pricing, platform). Publicly readable (it only holds public site
-- copy); writes happen exclusively through the admin panel using the
-- service role, so there is intentionally NO insert/update policy.
-- ---------------------------------------------------------------
create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.site_settings enable row level security;

drop policy if exists "site settings are publicly readable" on public.site_settings;
create policy "site settings are publicly readable"
  on public.site_settings for select
  using (true);

-- ---------------------------------------------------------------
-- testimonials — homepage testimonials, managed by admins
-- ---------------------------------------------------------------
create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  quote text not null,
  author_name text not null,
  author_role text,
  sort_order int not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.testimonials enable row level security;

drop policy if exists "published testimonials are public" on public.testimonials;
create policy "published testimonials are public"
  on public.testimonials for select
  using (is_published = true);

insert into public.testimonials (quote, author_name, author_role, sort_order)
select v.quote, v.author_name, v.author_role, v.sort_order
from (
  values
    ('Eventora''s AI planner turned a vague idea into a full budget and vendor shortlist in minutes. We booked our venue the same week.', 'Nusrat J.', 'Bride, Dhaka', 1),
    ('Managing guest RSVPs and the seating chart used to be a spreadsheet nightmare. Now it''s one screen.', 'Rafiq H.', 'Corporate Events Lead', 2),
    ('As a vendor, the quote requests come in pre-qualified with budget and guest count. Fewer back-and-forth messages.', 'Amber & Ash Photography', 'Vendor Partner', 3)
) as v(quote, author_name, author_role, sort_order)
where not exists (select 1 from public.testimonials);

-- ---------------------------------------------------------------
-- admin_audit_log — who changed what. No policies on purpose: only the
-- service role (admin panel) can read or write it.
-- ---------------------------------------------------------------
create table if not exists public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid,
  admin_email text,
  action text not null,
  entity text not null,
  entity_id text,
  details jsonb,
  created_at timestamptz not null default now()
);

create index if not exists admin_audit_log_created_at_idx
  on public.admin_audit_log (created_at desc);

alter table public.admin_audit_log enable row level security;

-- ---------------------------------------------------------------
-- Make your first admin (run once, with your own email):
--   update public.profiles set role = 'admin' where email = 'you@example.com';
-- Or set ADMIN_EMAILS=you@example.com in .env.local — a confirmed
-- account with that email is promoted automatically on first visit
-- to /admin.
-- ---------------------------------------------------------------
