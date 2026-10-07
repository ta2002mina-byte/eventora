-- ============================================================
-- Phase 04 — Venue Marketplace
-- Run this in the Supabase SQL editor (or via `supabase db push`).
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------
-- venues
-- ---------------------------------------------------------------
create table if not exists public.venues (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users (id) on delete set null,

  name text not null,
  slug text not null unique,
  description text,
  cover_image_url text,

  -- Fixed set of venue types (no separate lookup table needed —
  -- mirrors the fixed vendor-category list used in Phase 05).
  venue_type text not null default 'other' check (
    venue_type in (
      'banquet_hall', 'hotel', 'garden', 'rooftop',
      'restaurant', 'community_center', 'resort', 'other'
    )
  ),

  city text,
  address text,

  capacity_min int not null default 0,
  capacity_max int not null default 0,

  starting_price numeric(12, 2) not null default 0,
  currency text not null default 'BDT',

  -- Denormalized from venue_amenities so the marketplace can filter
  -- by amenity without an aggregate join on every request (same
  -- reasoning as `events.starting_price` in the 0001 migration).
  -- Kept in sync by the app whenever venue_amenities changes.
  amenities text[] not null default '{}',

  rules text,

  -- Denormalized from venue_reviews for fast list/sort by rating.
  rating_avg numeric(3, 2) not null default 0,
  rating_count int not null default 0,

  status text not null default 'published' check (status in ('draft', 'published', 'archived')),
  visibility text not null default 'public' check (visibility in ('public', 'private')),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists venues_status_type_idx on public.venues (status, venue_type);
create index if not exists venues_city_idx on public.venues (city);
create index if not exists venues_owner_id_idx on public.venues (owner_id);

-- ---------------------------------------------------------------
-- venue_images (gallery)
-- ---------------------------------------------------------------
create table if not exists public.venue_images (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues (id) on delete cascade,
  image_url text not null,
  alt_text text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists venue_images_venue_id_idx on public.venue_images (venue_id);

-- ---------------------------------------------------------------
-- venue_amenities (source of truth; venues.amenities is a cache of this)
-- ---------------------------------------------------------------
create table if not exists public.venue_amenities (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (venue_id, name)
);

create index if not exists venue_amenities_venue_id_idx on public.venue_amenities (venue_id);

-- ---------------------------------------------------------------
-- venue_availability (per-day calendar state)
-- ---------------------------------------------------------------
create table if not exists public.venue_availability (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues (id) on delete cascade,
  date date not null,
  status text not null default 'available' check (status in ('available', 'booked', 'blocked')),
  note text,
  created_at timestamptz not null default now(),
  unique (venue_id, date)
);

create index if not exists venue_availability_venue_id_date_idx
  on public.venue_availability (venue_id, date);

-- ---------------------------------------------------------------
-- venue_bookings (booking requests submitted by customers)
-- ---------------------------------------------------------------
create table if not exists public.venue_bookings (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,

  event_name text not null,
  event_date date not null,
  event_time time,
  guest_count int not null default 1,
  notes text,

  status text not null default 'pending' check (
    status in ('pending', 'confirmed', 'cancelled', 'completed')
  ),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists venue_bookings_venue_id_idx on public.venue_bookings (venue_id);
create index if not exists venue_bookings_user_id_idx on public.venue_bookings (user_id);

-- ---------------------------------------------------------------
-- venue_reviews
-- ---------------------------------------------------------------
create table if not exists public.venue_reviews (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  title text,
  comment text,
  created_at timestamptz not null default now(),
  unique (venue_id, user_id)
);

create index if not exists venue_reviews_venue_id_idx on public.venue_reviews (venue_id);

-- ---------------------------------------------------------------
-- venue_favorites (saved venues, per authenticated user)
-- Parallel to `favorites` (events) from Phase 03 — kept as a
-- separate table since `favorites.event_id` is NOT NULL and unrelated.
-- ---------------------------------------------------------------
create table if not exists public.venue_favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  venue_id uuid not null references public.venues (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, venue_id)
);

create index if not exists venue_favorites_user_id_idx on public.venue_favorites (user_id);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.venues enable row level security;
alter table public.venue_images enable row level security;
alter table public.venue_amenities enable row level security;
alter table public.venue_availability enable row level security;
alter table public.venue_bookings enable row level security;
alter table public.venue_reviews enable row level security;
alter table public.venue_favorites enable row level security;

-- Venues: published + public venues are readable by anyone.
-- Owners can always read/write their own venues (draft included).
create policy "published public venues are readable by anyone"
  on public.venues for select
  using (status = 'published' and visibility = 'public');

create policy "owners can read their own venues"
  on public.venues for select
  using (auth.uid() = owner_id);

create policy "owners can insert their own venues"
  on public.venues for insert
  with check (auth.uid() = owner_id);

create policy "owners can update their own venues"
  on public.venues for update
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "owners can delete their own venues"
  on public.venues for delete
  using (auth.uid() = owner_id);

-- Images / amenities / availability: readable whenever the parent
-- venue is readable; writable only by that venue's owner.
create policy "venue images readable when parent venue is readable"
  on public.venue_images for select
  using (
    exists (
      select 1 from public.venues v
      where v.id = venue_images.venue_id
        and ((v.status = 'published' and v.visibility = 'public') or v.owner_id = auth.uid())
    )
  );

create policy "owners manage their own venue images"
  on public.venue_images for all
  using (exists (select 1 from public.venues v where v.id = venue_images.venue_id and v.owner_id = auth.uid()))
  with check (exists (select 1 from public.venues v where v.id = venue_images.venue_id and v.owner_id = auth.uid()));

create policy "venue amenities readable when parent venue is readable"
  on public.venue_amenities for select
  using (
    exists (
      select 1 from public.venues v
      where v.id = venue_amenities.venue_id
        and ((v.status = 'published' and v.visibility = 'public') or v.owner_id = auth.uid())
    )
  );

create policy "owners manage their own venue amenities"
  on public.venue_amenities for all
  using (exists (select 1 from public.venues v where v.id = venue_amenities.venue_id and v.owner_id = auth.uid()))
  with check (exists (select 1 from public.venues v where v.id = venue_amenities.venue_id and v.owner_id = auth.uid()));

create policy "venue availability readable when parent venue is readable"
  on public.venue_availability for select
  using (
    exists (
      select 1 from public.venues v
      where v.id = venue_availability.venue_id
        and ((v.status = 'published' and v.visibility = 'public') or v.owner_id = auth.uid())
    )
  );

create policy "owners manage their own venue availability"
  on public.venue_availability for all
  using (exists (select 1 from public.venues v where v.id = venue_availability.venue_id and v.owner_id = auth.uid()))
  with check (exists (select 1 from public.venues v where v.id = venue_availability.venue_id and v.owner_id = auth.uid()));

-- Bookings: strictly private between the requesting user and the venue owner.
create policy "users can read their own venue bookings"
  on public.venue_bookings for select
  using (auth.uid() = user_id);

create policy "owners can read bookings for their own venues"
  on public.venue_bookings for select
  using (exists (select 1 from public.venues v where v.id = venue_bookings.venue_id and v.owner_id = auth.uid()));

create policy "users can create their own venue booking requests"
  on public.venue_bookings for insert
  with check (auth.uid() = user_id);

create policy "users can cancel their own pending venue bookings"
  on public.venue_bookings for delete
  using (auth.uid() = user_id and status = 'pending');

create policy "owners can update bookings for their own venues"
  on public.venue_bookings for update
  using (exists (select 1 from public.venues v where v.id = venue_bookings.venue_id and v.owner_id = auth.uid()))
  with check (exists (select 1 from public.venues v where v.id = venue_bookings.venue_id and v.owner_id = auth.uid()));

-- Reviews: readable whenever the parent venue is readable. Writable by
-- the review's author. Phase 11 adds eligibility checks (completed
-- booking required) on top of this base policy.
create policy "venue reviews readable when parent venue is readable"
  on public.venue_reviews for select
  using (
    exists (
      select 1 from public.venues v
      where v.id = venue_reviews.venue_id
        and ((v.status = 'published' and v.visibility = 'public') or v.owner_id = auth.uid())
    )
  );

create policy "users manage their own venue reviews"
  on public.venue_reviews for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Favorites: strictly private to the owning user.
create policy "users can read their own venue favorites"
  on public.venue_favorites for select
  using (auth.uid() = user_id);

create policy "users can add their own venue favorites"
  on public.venue_favorites for insert
  with check (auth.uid() = user_id);

create policy "users can remove their own venue favorites"
  on public.venue_favorites for delete
  using (auth.uid() = user_id);

-- ============================================================
-- Seed: demo venues (safe to re-run)
-- ============================================================
insert into public.venues (
  name, slug, description, venue_type, city, address,
  capacity_min, capacity_max, starting_price, currency, amenities,
  rules, rating_avg, rating_count, status, visibility
) values
  (
    'Willow Garden Hall', 'willow-garden-hall',
    'An open-air garden venue with a covered pavilion, fairy-lit pathways and a private lawn — a favourite for spring and winter weddings.',
    'garden', 'Dhaka', 'Road 11, Gulshan 1, Dhaka',
    50, 500, 80000, 'BDT',
    array['Parking', 'Catering', 'Sound System', 'Generator', 'Decor'],
    'No outside catering. Music must end by 11 PM. Alcohol not permitted.',
    4.9, 24, 'published', 'public'
  ),
  (
    'The Champagne Room', 'the-champagne-room',
    'An elegant indoor banquet space with crystal chandeliers and a built-in stage, ideal for intimate receptions and corporate galas.',
    'banquet_hall', 'Dhaka', 'Road 27, Banani, Dhaka',
    20, 150, 45000, 'BDT',
    array['AC', 'Parking', 'Sound System', 'Stage', 'WiFi'],
    'Full payment required 7 days before the event. Decor must be pre-approved.',
    4.8, 17, 'published', 'public'
  ),
  (
    'Skyline Rooftop Lounge', 'skyline-rooftop-lounge',
    'A city-view rooftop with lounge seating, a bar counter and ambient lighting — built for evening celebrations.',
    'rooftop', 'Dhaka', 'Gulshan Avenue, Dhaka',
    30, 200, 60000, 'BDT',
    array['Parking', 'Sound System', 'Generator', 'WiFi'],
    'Bookings close at midnight. No confetti or fireworks.',
    4.7, 12, 'published', 'public'
  ),
  (
    'Lakeview Convention Center', 'lakeview-convention-center',
    'A large-capacity convention hall with breakout rooms, a green room and a dedicated loading dock — built for conferences and large weddings.',
    'hotel', 'Dhaka', 'Airport Road, Dhaka',
    100, 1200, 150000, 'BDT',
    array['AC', 'Parking', 'Catering', 'Sound System', 'Stage', 'Green Room', 'Generator', 'WiFi'],
    'Security deposit required. Vendors must check in with venue security.',
    4.6, 31, 'published', 'public'
  ),
  (
    'Riverside Community Hall', 'riverside-community-hall',
    'A budget-friendly community hall by the river, popular for birthdays, reunions and neighbourhood gatherings.',
    'community_center', 'Narayanganj', 'Riverside Road, Narayanganj',
    20, 300, 15000, 'BDT',
    array['Parking', 'Generator'],
    'Cleanup required within 2 hours of event end.',
    4.3, 9, 'published', 'public'
  ),
  (
    'The Orchid Resort & Gardens', 'the-orchid-resort-gardens',
    'A destination resort venue with manicured gardens, guest villas and an in-house catering team — suited to multi-day wedding events.',
    'resort', 'Gazipur', 'Bhawal Resort Area, Gazipur',
    50, 800, 220000, 'BDT',
    array['Parking', 'Catering', 'Sound System', 'Stage', 'Decor', 'AC', 'WiFi'],
    'Minimum two-night guest villa booking required for weekend events.',
    5.0, 6, 'published', 'public'
  )
on conflict (slug) do nothing;

-- Keep venue_amenities in sync with the seeded venues.amenities cache.
insert into public.venue_amenities (venue_id, name)
select v.id, a.amenity
from public.venues v
cross join lateral unnest(v.amenities) as a(amenity)
on conflict (venue_id, name) do nothing;

-- Seed a rolling 45-day availability window per venue: mostly
-- available, with a couple of booked/blocked days sprinkled in.
insert into public.venue_availability (venue_id, date, status)
select
  v.id,
  d::date,
  case
    when (v.rating_count + extract(day from d)::int) % 11 = 0 then 'booked'
    when (v.rating_count + extract(day from d)::int) % 17 = 0 then 'blocked'
    else 'available'
  end
from public.venues v
cross join generate_series(current_date, current_date + interval '44 days', interval '1 day') as d
on conflict (venue_id, date) do nothing;

-- A couple of sample reviews on the top-rated venue only, so the UI
-- can demonstrate both the "has reviews" and empty states.
insert into public.venue_reviews (venue_id, user_id, rating, title, comment)
select v.id, u.id, 5, 'Absolutely beautiful', 'Our wedding here was perfect — the staff handled everything.'
from public.venues v, (select id from auth.users limit 1) u
where v.slug = 'willow-garden-hall' and u.id is not null
on conflict (venue_id, user_id) do nothing;
