-- Phase: Contact form
-- Public contact submissions. No admin UI exists yet — this table just
-- captures messages so they aren't lost; read them via the Supabase
-- Table Editor / SQL editor for now.

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  subject text not null,
  message text not null,
  created_at timestamptz not null default now()
);

alter table public.contact_messages enable row level security;

-- Anyone (including signed-out visitors) can submit the contact form.
drop policy if exists "anyone can submit a contact message" on public.contact_messages;
create policy "anyone can submit a contact message"
  on public.contact_messages for insert
  with check (true);

-- No one can read contact messages via the client API (no admin role yet).
-- Use the Supabase Table Editor / SQL editor to review submissions.
