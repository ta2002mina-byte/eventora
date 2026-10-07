-- ============================================================
-- Phase 09 — Vendor Dashboard
-- Run this in the Supabase SQL editor (or via `supabase db push`).
-- ============================================================

-- ---------------------------------------------------------------
-- profiles
-- A minimal public profile row per auth user, so other parts of the
-- app (vendor dashboard customers/bookings, reviews, messages later)
-- can show a display name without ever exposing auth.users directly.
-- ---------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  email text,
  avatar_url text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles are readable by their owner"
  on public.profiles for select
  using (auth.uid() = id);

-- A vendor owner may see the profile of any customer who has an
-- active relationship with their vendor (booking or review) — never
-- the full user directory.
create policy "profiles are readable by vendors with a shared booking"
  on public.profiles for select
  using (
    exists (
      select 1 from public.vendor_bookings vb
      join public.vendors v on v.id = vb.vendor_id
      where vb.user_id = profiles.id and v.owner_id = auth.uid()
    )
    or exists (
      select 1 from public.vendor_reviews vr
      join public.vendors v on v.id = vr.vendor_id
      where vr.user_id = profiles.id and v.owner_id = auth.uid()
    )
  );

create policy "users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Auto-create a profile row whenever a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, new.raw_user_meta_data ->> 'full_name', new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill profiles for any users created before this migration.
insert into public.profiles (id, full_name, email)
select id, raw_user_meta_data ->> 'full_name', email
from auth.users
on conflict (id) do nothing;

-- ---------------------------------------------------------------
-- vendors: profile-page fields not covered in Phase 05
-- ---------------------------------------------------------------
alter table public.vendors
  add column if not exists logo_url text,
  add column if not exists contact_email text,
  add column if not exists contact_phone text;

-- ---------------------------------------------------------------
-- vendor_services: enable/disable
-- ---------------------------------------------------------------
alter table public.vendor_services
  add column if not exists is_active boolean not null default true,
  add column if not exists updated_at timestamptz not null default now();

-- ---------------------------------------------------------------
-- vendor_packages: enable/disable + availability + updated_at
-- ---------------------------------------------------------------
alter table public.vendor_packages
  add column if not exists is_active boolean not null default true,
  add column if not exists updated_at timestamptz not null default now();

-- ---------------------------------------------------------------
-- vendor_bookings: agreed amount + payment status + response tracking
-- so the Earnings page has something to total up ahead of the real
-- payments system that ships in Phase 10.
-- ---------------------------------------------------------------
alter table public.vendor_bookings
  add column if not exists amount numeric(12, 2),
  add column if not exists payment_status text not null default 'pending'
    check (payment_status in ('pending', 'paid', 'refunded')),
  add column if not exists responded_at timestamptz;

-- ============================================================
-- RLS: allow vendor owners to update service/package active state
-- and booking status — already covered by the Phase 05 "owners
-- manage their own vendor X" / "owners can update bookings for
-- their own vendor profile" policies (for update via `for all` /
-- explicit update policies), so no new policies are required for
-- those tables. Re-stated here for clarity, not re-created.
-- ============================================================

-- ============================================================
-- Backfill: claim a demo vendor for local testing
-- ------------------------------------------------------------
-- If you want to sign in as a vendor right away without going
-- through the onboarding flow, run this once with your own user's
-- email substituted in, then refresh /vendor/dashboard:
--
--   update public.vendors
--   set owner_id = (select id from auth.users where email = 'you@example.com')
--   where slug = 'aperture-and-co-photography';
--
-- Left commented out — the Vendor Dashboard's onboarding screen
-- (shown automatically to any signed-in user without a vendor
-- profile) is the intended path for new vendors.
-- ============================================================
