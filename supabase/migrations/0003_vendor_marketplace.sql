-- ============================================================
-- Phase 05 — Vendor Marketplace
-- Run this in the Supabase SQL editor (or via `supabase db push`).
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------
-- vendors
-- ---------------------------------------------------------------
create table if not exists public.vendors (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users (id) on delete set null,

  business_name text not null,
  slug text not null unique,
  description text,
  cover_image_url text,

  -- Fixed set of vendor categories (mirrors the fixed venue_type
  -- list from the 0002 migration).
  category text not null default 'other' check (
    category in (
      'photography', 'videography', 'catering', 'decoration',
      'dj_music', 'makeup', 'security', 'transport',
      'event_planner', 'other'
    )
  ),

  city text,
  address text,
  -- Cities/areas this vendor is willing to travel to, shown on the
  -- detail page. Kept as a simple text[] — no separate lookup table
  -- needed at this scale.
  service_area text[] not null default '{}',

  starting_price numeric(12, 2) not null default 0,
  currency text not null default 'BDT',

  years_experience int not null default 0,
  response_time_hours int,

  -- Denormalized from vendor_reviews for fast list/sort by rating.
  rating_avg numeric(3, 2) not null default 0,
  rating_count int not null default 0,

  status text not null default 'published' check (status in ('draft', 'published', 'archived')),
  visibility text not null default 'public' check (visibility in ('public', 'private')),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists vendors_status_category_idx on public.vendors (status, category);
create index if not exists vendors_city_idx on public.vendors (city);
create index if not exists vendors_owner_id_idx on public.vendors (owner_id);

-- ---------------------------------------------------------------
-- vendor_services (individual à la carte services)
-- ---------------------------------------------------------------
create table if not exists public.vendor_services (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors (id) on delete cascade,
  name text not null,
  description text,
  price numeric(12, 2) not null default 0,
  unit text, -- e.g. "per event", "per hour", "per person"
  created_at timestamptz not null default now()
);

create index if not exists vendor_services_vendor_id_idx on public.vendor_services (vendor_id);

-- ---------------------------------------------------------------
-- vendor_packages (bundled offerings with fixed pricing)
-- ---------------------------------------------------------------
create table if not exists public.vendor_packages (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors (id) on delete cascade,
  name text not null,
  description text,
  price numeric(12, 2) not null default 0,
  duration text, -- e.g. "Full day", "4 hours"
  included_services text[] not null default '{}',
  is_popular boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists vendor_packages_vendor_id_idx on public.vendor_packages (vendor_id);

-- ---------------------------------------------------------------
-- vendor_portfolio (past project gallery)
-- ---------------------------------------------------------------
create table if not exists public.vendor_portfolio (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors (id) on delete cascade,
  image_url text,
  project_name text,
  caption text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists vendor_portfolio_vendor_id_idx on public.vendor_portfolio (vendor_id);

-- ---------------------------------------------------------------
-- vendor_availability (per-day calendar state)
-- ---------------------------------------------------------------
create table if not exists public.vendor_availability (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors (id) on delete cascade,
  date date not null,
  status text not null default 'available' check (status in ('available', 'booked', 'blocked')),
  note text,
  created_at timestamptz not null default now(),
  unique (vendor_id, date)
);

create index if not exists vendor_availability_vendor_id_date_idx
  on public.vendor_availability (vendor_id, date);

-- ---------------------------------------------------------------
-- vendor_bookings (quote requests submitted by customers)
-- ---------------------------------------------------------------
create table if not exists public.vendor_bookings (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,

  event_name text not null,
  package_id uuid references public.vendor_packages (id) on delete set null,
  service_name text,
  event_date date not null,
  guest_count int not null default 1,
  budget numeric(12, 2),
  notes text,

  status text not null default 'pending' check (
    status in ('pending', 'confirmed', 'cancelled', 'completed')
  ),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists vendor_bookings_vendor_id_idx on public.vendor_bookings (vendor_id);
create index if not exists vendor_bookings_user_id_idx on public.vendor_bookings (user_id);

-- ---------------------------------------------------------------
-- vendor_reviews
-- ---------------------------------------------------------------
create table if not exists public.vendor_reviews (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  title text,
  comment text,
  created_at timestamptz not null default now(),
  unique (vendor_id, user_id)
);

create index if not exists vendor_reviews_vendor_id_idx on public.vendor_reviews (vendor_id);

-- ---------------------------------------------------------------
-- vendor_favorites (saved vendors, per authenticated user)
-- Parallel to `venue_favorites` from Phase 04.
-- ---------------------------------------------------------------
create table if not exists public.vendor_favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  vendor_id uuid not null references public.vendors (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, vendor_id)
);

create index if not exists vendor_favorites_user_id_idx on public.vendor_favorites (user_id);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.vendors enable row level security;
alter table public.vendor_services enable row level security;
alter table public.vendor_packages enable row level security;
alter table public.vendor_portfolio enable row level security;
alter table public.vendor_availability enable row level security;
alter table public.vendor_bookings enable row level security;
alter table public.vendor_reviews enable row level security;
alter table public.vendor_favorites enable row level security;

-- Vendors: published + public vendors are readable by anyone.
-- Owners can always read/write their own vendor profile (draft included).
create policy "published public vendors are readable by anyone"
  on public.vendors for select
  using (status = 'published' and visibility = 'public');

create policy "owners can read their own vendor profile"
  on public.vendors for select
  using (auth.uid() = owner_id);

create policy "owners can insert their own vendor profile"
  on public.vendors for insert
  with check (auth.uid() = owner_id);

create policy "owners can update their own vendor profile"
  on public.vendors for update
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "owners can delete their own vendor profile"
  on public.vendors for delete
  using (auth.uid() = owner_id);

-- Services / packages / portfolio / availability: readable whenever
-- the parent vendor is readable; writable only by that vendor's owner.
-- This prepares the architecture the Vendor Dashboard (Phase 09) will
-- use to manage these rows.
create policy "vendor services readable when parent vendor is readable"
  on public.vendor_services for select
  using (
    exists (
      select 1 from public.vendors v
      where v.id = vendor_services.vendor_id
        and ((v.status = 'published' and v.visibility = 'public') or v.owner_id = auth.uid())
    )
  );

create policy "owners manage their own vendor services"
  on public.vendor_services for all
  using (exists (select 1 from public.vendors v where v.id = vendor_services.vendor_id and v.owner_id = auth.uid()))
  with check (exists (select 1 from public.vendors v where v.id = vendor_services.vendor_id and v.owner_id = auth.uid()));

create policy "vendor packages readable when parent vendor is readable"
  on public.vendor_packages for select
  using (
    exists (
      select 1 from public.vendors v
      where v.id = vendor_packages.vendor_id
        and ((v.status = 'published' and v.visibility = 'public') or v.owner_id = auth.uid())
    )
  );

create policy "owners manage their own vendor packages"
  on public.vendor_packages for all
  using (exists (select 1 from public.vendors v where v.id = vendor_packages.vendor_id and v.owner_id = auth.uid()))
  with check (exists (select 1 from public.vendors v where v.id = vendor_packages.vendor_id and v.owner_id = auth.uid()));

create policy "vendor portfolio readable when parent vendor is readable"
  on public.vendor_portfolio for select
  using (
    exists (
      select 1 from public.vendors v
      where v.id = vendor_portfolio.vendor_id
        and ((v.status = 'published' and v.visibility = 'public') or v.owner_id = auth.uid())
    )
  );

create policy "owners manage their own vendor portfolio"
  on public.vendor_portfolio for all
  using (exists (select 1 from public.vendors v where v.id = vendor_portfolio.vendor_id and v.owner_id = auth.uid()))
  with check (exists (select 1 from public.vendors v where v.id = vendor_portfolio.vendor_id and v.owner_id = auth.uid()));

create policy "vendor availability readable when parent vendor is readable"
  on public.vendor_availability for select
  using (
    exists (
      select 1 from public.vendors v
      where v.id = vendor_availability.vendor_id
        and ((v.status = 'published' and v.visibility = 'public') or v.owner_id = auth.uid())
    )
  );

create policy "owners manage their own vendor availability"
  on public.vendor_availability for all
  using (exists (select 1 from public.vendors v where v.id = vendor_availability.vendor_id and v.owner_id = auth.uid()))
  with check (exists (select 1 from public.vendors v where v.id = vendor_availability.vendor_id and v.owner_id = auth.uid()));

-- Bookings (quote requests): strictly private between the requesting
-- user and the vendor owner.
create policy "users can read their own vendor bookings"
  on public.vendor_bookings for select
  using (auth.uid() = user_id);

create policy "owners can read bookings for their own vendor profile"
  on public.vendor_bookings for select
  using (exists (select 1 from public.vendors v where v.id = vendor_bookings.vendor_id and v.owner_id = auth.uid()));

create policy "users can create their own vendor quote requests"
  on public.vendor_bookings for insert
  with check (auth.uid() = user_id);

create policy "users can cancel their own pending vendor bookings"
  on public.vendor_bookings for delete
  using (auth.uid() = user_id and status = 'pending');

create policy "owners can update bookings for their own vendor profile"
  on public.vendor_bookings for update
  using (exists (select 1 from public.vendors v where v.id = vendor_bookings.vendor_id and v.owner_id = auth.uid()))
  with check (exists (select 1 from public.vendors v where v.id = vendor_bookings.vendor_id and v.owner_id = auth.uid()));

-- Reviews: readable whenever the parent vendor is readable. Writable
-- by the review's author. Phase 11 adds eligibility checks (completed
-- booking required) on top of this base policy.
create policy "vendor reviews readable when parent vendor is readable"
  on public.vendor_reviews for select
  using (
    exists (
      select 1 from public.vendors v
      where v.id = vendor_reviews.vendor_id
        and ((v.status = 'published' and v.visibility = 'public') or v.owner_id = auth.uid())
    )
  );

create policy "users manage their own vendor reviews"
  on public.vendor_reviews for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Favorites: strictly private to the owning user.
create policy "users can read their own vendor favorites"
  on public.vendor_favorites for select
  using (auth.uid() = user_id);

create policy "users can add their own vendor favorites"
  on public.vendor_favorites for insert
  with check (auth.uid() = user_id);

create policy "users can remove their own vendor favorites"
  on public.vendor_favorites for delete
  using (auth.uid() = user_id);

-- ============================================================
-- Seed: demo vendors (safe to re-run)
-- ============================================================
insert into public.vendors (
  business_name, slug, description, category, city, address, service_area,
  starting_price, currency, years_experience, response_time_hours,
  rating_avg, rating_count, status, visibility
) values
  (
    'Aperture & Co. Photography', 'aperture-and-co-photography',
    'Candid, editorial-style wedding and event photography with same-week sneak peeks and a full-resolution online gallery.',
    'photography', 'Dhaka', 'Road 3, Dhanmondi, Dhaka',
    array['Dhaka', 'Gazipur', 'Narayanganj'],
    35000, 'BDT', 8, 4,
    4.9, 41, 'published', 'public'
  ),
  (
    'Frame & Focus Films', 'frame-and-focus-films',
    'Cinematic wedding and corporate-event videography, drone coverage included on all full-day packages.',
    'videography', 'Dhaka', 'Uttara Sector 7, Dhaka',
    array['Dhaka', 'Gazipur'],
    50000, 'BDT', 6, 6,
    4.8, 22, 'published', 'public'
  ),
  (
    'Spice Route Catering', 'spice-route-catering',
    'Full-service catering for weddings and corporate events — Bengali, Continental and fusion menus with live counters.',
    'catering', 'Dhaka', 'Bashundhara R/A, Dhaka',
    array['Dhaka', 'Narayanganj', 'Gazipur', 'Savar'],
    600, 'BDT', 12, 8,
    4.7, 63, 'published', 'public'
  ),
  (
    'Petal & Thread Decor', 'petal-and-thread-decor',
    'Floral design and stage decor studio specializing in garden weddings and gold-accented reception setups.',
    'decoration', 'Dhaka', 'Road 27, Banani, Dhaka',
    array['Dhaka'],
    45000, 'BDT', 5, 12,
    4.9, 34, 'published', 'public'
  ),
  (
    'Beat Society DJs', 'beat-society-djs',
    'DJ and live sound crew for weddings, corporate parties and concerts, with an in-house lighting rig.',
    'dj_music', 'Dhaka', 'Gulshan 2, Dhaka',
    array['Dhaka', 'Gazipur'],
    28000, 'BDT', 7, 3,
    4.6, 19, 'published', 'public'
  ),
  (
    'Glow Studio Makeup & Hair', 'glow-studio-makeup-hair',
    'Bridal and party makeup artistry with HD and airbrush finishes, on-site service available.',
    'makeup', 'Dhaka', 'Road 11, Gulshan 1, Dhaka',
    array['Dhaka'],
    12000, 'BDT', 9, 2,
    5.0, 57, 'published', 'public'
  ),
  (
    'Shield Guard Event Security', 'shield-guard-event-security',
    'Licensed event security teams for weddings, concerts and corporate functions, with crowd-management experience.',
    'security', 'Dhaka', 'Mirpur DOHS, Dhaka',
    array['Dhaka', 'Narayanganj'],
    18000, 'BDT', 10, 6,
    4.5, 14, 'published', 'public'
  ),
  (
    'Metro Fleet Transport', 'metro-fleet-transport',
    'Guest shuttle and luxury car rental for weddings and corporate events, with uniformed drivers.',
    'transport', 'Dhaka', 'Airport Road, Dhaka',
    array['Dhaka', 'Gazipur', 'Narayanganj'],
    15000, 'BDT', 6, 4,
    4.4, 11, 'published', 'public'
  ),
  (
    'Blueprint Events Co.', 'blueprint-events-co',
    'Full-service event planning and day-of coordination for weddings, corporate launches and milestone celebrations.',
    'event_planner', 'Dhaka', 'Road 90, Gulshan 2, Dhaka',
    array['Dhaka', 'Gazipur', 'Narayanganj', 'Savar'],
    75000, 'BDT', 11, 5,
    4.9, 29, 'published', 'public'
  )
on conflict (slug) do nothing;

-- Services: a couple of à la carte offerings per vendor.
insert into public.vendor_services (vendor_id, name, description, price, unit)
select v.id, s.name, s.description, s.price, s.unit
from public.vendors v
join lateral (
  values
    ('aperture-and-co-photography', 'Half-day coverage', '4 hours of coverage with an edited online gallery.', 20000, 'per event'),
    ('aperture-and-co-photography', 'Additional photographer', 'A second shooter for wider event coverage.', 8000, 'per event'),
    ('spice-route-catering', 'Plated dinner service', 'Three-course plated service with waitstaff.', 900, 'per person'),
    ('spice-route-catering', 'Live counter add-on', 'A single live-cooking station (e.g. biryani, dessert).', 25000, 'per event'),
    ('petal-and-thread-decor', 'Stage backdrop', 'Floral and fabric backdrop for the main stage.', 30000, 'per event'),
    ('glow-studio-makeup-hair', 'Bridal trial session', 'A full trial run before the event day.', 6000, 'per session')
) as s(slug, name, description, price, unit) on s.slug = v.slug
on conflict do nothing;

-- Packages: bundled offerings with included-services checklists.
insert into public.vendor_packages (vendor_id, name, description, price, duration, included_services, is_popular)
select v.id, p.name, p.description, p.price, p.duration, p.included_services, p.is_popular
from public.vendors v
join lateral (
  values
    (
      'aperture-and-co-photography', 'Full Wedding Package',
      'Complete wedding-day coverage from getting-ready to reception.',
      60000, 'Full day',
      array['8 hours of coverage', 'Two photographers', 'Edited online gallery', 'USB with high-res files'],
      true
    ),
    (
      'spice-route-catering', 'Wedding Feast Package',
      'Full-menu catering for 200 guests with buffet setup and service staff.',
      150000, '200 guests',
      array['5-course buffet menu', 'Service staff', 'Table settings', 'Live dessert counter'],
      true
    ),
    (
      'petal-and-thread-decor', 'Garden Reception Package',
      'Full venue decor for an outdoor reception, including stage, walkway and table centerpieces.',
      120000, 'Full setup',
      array['Stage backdrop', 'Walkway florals', 'Table centerpieces', 'Fairy-light installation'],
      true
    ),
    (
      'beat-society-djs', 'Evening Party Package',
      '6-hour DJ set with full sound system and dance-floor lighting.',
      45000, '6 hours',
      array['DJ + MC', 'Sound system', 'Dance-floor lighting', 'Wireless mic'],
      false
    ),
    (
      'blueprint-events-co', 'Full Planning & Coordination',
      'End-to-end planning from vendor sourcing to day-of coordination.',
      200000, 'Full event lifecycle',
      array['Vendor sourcing', 'Budget management', 'Timeline planning', 'Day-of coordination team'],
      true
    )
) as p(slug, name, description, price, duration, included_services, is_popular) on p.slug = v.slug
on conflict do nothing;

-- Portfolio: a few sample project entries per vendor.
insert into public.vendor_portfolio (vendor_id, project_name, caption, sort_order)
select v.id, pf.project_name, pf.caption, pf.sort_order
from public.vendors v
join lateral (
  values
    ('aperture-and-co-photography', 'Rahim & Amina''s Wedding', 'Garden ceremony, Dhaka', 1),
    ('aperture-and-co-photography', 'Tech Summit 2025', 'Corporate conference coverage', 2),
    ('petal-and-thread-decor', 'Champagne Room Reception', 'Gold and ivory theme', 1),
    ('petal-and-thread-decor', 'Riverside Birthday', 'Pastel garden theme', 2),
    ('glow-studio-makeup-hair', 'Bridal Look — Classic', 'HD finish, traditional saree look', 1),
    ('blueprint-events-co', 'Lakeview Convention Gala', 'Full-scale corporate gala', 1)
) as pf(slug, project_name, caption, sort_order) on pf.slug = v.slug
on conflict do nothing;

-- Seed a rolling 45-day availability window per vendor: mostly
-- available, with a couple of booked/blocked days sprinkled in.
insert into public.vendor_availability (vendor_id, date, status)
select
  v.id,
  d::date,
  case
    when (v.rating_count + extract(day from d)::int) % 11 = 0 then 'booked'
    when (v.rating_count + extract(day from d)::int) % 17 = 0 then 'blocked'
    else 'available'
  end
from public.vendors v
cross join generate_series(current_date, current_date + interval '44 days', interval '1 day') as d
on conflict (vendor_id, date) do nothing;

-- A couple of sample reviews on top-rated vendors only, so the UI can
-- demonstrate both the "has reviews" and empty states.
insert into public.vendor_reviews (vendor_id, user_id, rating, title, comment)
select v.id, u.id, 5, 'Exceeded expectations', 'Professional, punctual and the results were stunning.'
from public.vendors v, (select id from auth.users limit 1) u
where v.slug = 'glow-studio-makeup-hair' and u.id is not null
on conflict (vendor_id, user_id) do nothing;
