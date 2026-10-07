-- ============================================================
-- Phase 11 — Messaging + Reviews
-- Run this in the Supabase SQL editor (or via `supabase db push`).
-- ============================================================

-- ---------------------------------------------------------------
-- conversations — one thread per (context, pair of participants).
-- context_type/context_id point at what the conversation is about
-- (a vendor, a venue, or an event) so the UI can deep-link back.
-- Both are nullable to allow a general/support-style thread later.
-- last_message_at/last_message_preview are denormalized by the
-- messages_touch_conversation trigger below so the inbox list never
-- needs a correlated subquery per row.
-- ---------------------------------------------------------------
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  context_type text check (context_type in ('vendor', 'venue', 'event', 'general')),
  context_id uuid,
  subject text,
  last_message_at timestamptz not null default now(),
  last_message_preview text,
  created_at timestamptz not null default now()
);

create index if not exists conversations_context_idx
  on public.conversations (context_type, context_id);
create index if not exists conversations_last_message_at_idx
  on public.conversations (last_message_at desc);

-- ---------------------------------------------------------------
-- conversation_participants — who is in a thread. role is a display
-- hint only (RLS never depends on it); membership itself is what
-- grants access.
-- ---------------------------------------------------------------
create table if not exists public.conversation_participants (
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'customer' check (role in ('customer', 'vendor', 'venue', 'organizer')),
  last_read_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

create index if not exists conversation_participants_user_id_idx
  on public.conversation_participants (user_id);

-- ---------------------------------------------------------------
-- messages
-- ---------------------------------------------------------------
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid not null references auth.users (id) on delete cascade,
  body text not null check (length(trim(body)) > 0),
  created_at timestamptz not null default now(),
  edited_at timestamptz
);

create index if not exists messages_conversation_id_idx
  on public.messages (conversation_id, created_at);

-- ---------------------------------------------------------------
-- message_attachments — UI is built for this from day one; actual
-- uploads go through Supabase Storage once a bucket is wired up.
-- ---------------------------------------------------------------
create table if not exists public.message_attachments (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages (id) on delete cascade,
  file_name text not null,
  file_url text not null,
  file_type text,
  size_bytes int,
  created_at timestamptz not null default now()
);

create index if not exists message_attachments_message_id_idx
  on public.message_attachments (message_id);

-- ---------------------------------------------------------------
-- event_reviews — parallel to venue_reviews / vendor_reviews.
-- ---------------------------------------------------------------
create table if not exists public.event_reviews (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  title text,
  comment text,
  status text not null default 'published' check (status in ('published', 'hidden')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, user_id)
);

create index if not exists event_reviews_event_id_idx on public.event_reviews (event_id);

-- rating_avg / rating_count on events, kept in sync the same way
-- vendors/venues already are (see refresh_rating_aggregate below).
alter table public.events add column if not exists rating_avg numeric(3, 2) not null default 0;
alter table public.events add column if not exists rating_count int not null default 0;

-- Moderation + editability, added to the two review tables from
-- earlier phases so all three behave the same way in Phase 11.
alter table public.vendor_reviews add column if not exists status text not null default 'published' check (status in ('published', 'hidden'));
alter table public.vendor_reviews add column if not exists updated_at timestamptz not null default now();
alter table public.venue_reviews add column if not exists status text not null default 'published' check (status in ('published', 'hidden'));
alter table public.venue_reviews add column if not exists updated_at timestamptz not null default now();

-- ============================================================
-- Eligibility helpers — "did this user legitimately book/use this?"
-- SECURITY DEFINER so they read bookings tables directly (as the
-- function owner, who bypasses RLS) rather than relying on the
-- calling user's own read policies, which keeps them usable from
-- any RLS context without extra grants.
-- ============================================================
create or replace function public.has_completed_event_booking(p_event_id uuid, p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.bookings b
    where b.event_id = p_event_id and b.user_id = p_user_id and b.status = 'completed'
  );
$$;

create or replace function public.has_completed_venue_booking(p_venue_id uuid, p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.venue_bookings vb
    where vb.venue_id = p_venue_id and vb.user_id = p_user_id and vb.status = 'completed'
  );
$$;

create or replace function public.has_completed_vendor_booking(p_vendor_id uuid, p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.vendor_bookings vb
    where vb.vendor_id = p_vendor_id and vb.user_id = p_user_id and vb.status = 'completed'
  );
$$;

grant execute on function public.has_completed_event_booking(uuid, uuid) to authenticated;
grant execute on function public.has_completed_venue_booking(uuid, uuid) to authenticated;
grant execute on function public.has_completed_vendor_booking(uuid, uuid) to authenticated;

-- ============================================================
-- Rating aggregate trigger — recalculates {parent}.rating_avg /
-- rating_count from published reviews whenever a review row
-- changes. One generic function driven by trigger arguments so
-- vendors/venues/events all share it instead of three copies.
-- ============================================================
create or replace function public.refresh_rating_aggregate()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_parent_table text := TG_ARGV[0];
  v_fk_col text := TG_ARGV[1];
  v_target_id uuid;
  v_avg numeric;
  v_count int;
begin
  if TG_OP = 'DELETE' then
    v_target_id := (to_jsonb(OLD) ->> v_fk_col)::uuid;
  else
    v_target_id := (to_jsonb(NEW) ->> v_fk_col)::uuid;
  end if;

  execute format(
    'select coalesce(avg(rating), 0), count(*) from public.%I where %I = $1 and status = ''published''',
    TG_TABLE_NAME, v_fk_col
  ) into v_avg, v_count using v_target_id;

  execute format('update public.%I set rating_avg = $1, rating_count = $2 where id = $3', v_parent_table)
    using round(v_avg, 2), v_count, v_target_id;

  return coalesce(NEW, OLD);
end;
$$;

drop trigger if exists vendor_reviews_refresh_rating on public.vendor_reviews;
create trigger vendor_reviews_refresh_rating
  after insert or update or delete on public.vendor_reviews
  for each row execute function public.refresh_rating_aggregate('vendors', 'vendor_id');

drop trigger if exists venue_reviews_refresh_rating on public.venue_reviews;
create trigger venue_reviews_refresh_rating
  after insert or update or delete on public.venue_reviews
  for each row execute function public.refresh_rating_aggregate('venues', 'venue_id');

drop trigger if exists event_reviews_refresh_rating on public.event_reviews;
create trigger event_reviews_refresh_rating
  after insert or update or delete on public.event_reviews
  for each row execute function public.refresh_rating_aggregate('events', 'event_id');

-- Backfill existing sample data (vendor_reviews/venue_reviews from
-- Phases 04/05) into the aggregates now that the trigger exists.
update public.vendors v set rating_avg = t.avg_rating, rating_count = t.cnt
from (
  select vendor_id, round(avg(rating), 2) as avg_rating, count(*) as cnt
  from public.vendor_reviews where status = 'published' group by vendor_id
) t
where t.vendor_id = v.id;

update public.venues ve set rating_avg = t.avg_rating, rating_count = t.cnt
from (
  select venue_id, round(avg(rating), 2) as avg_rating, count(*) as cnt
  from public.venue_reviews where status = 'published' group by venue_id
) t
where t.venue_id = ve.id;

-- ============================================================
-- Messaging helpers + RPC
-- ============================================================

-- Membership check used by every messaging RLS policy below.
-- SECURITY DEFINER (and therefore exempt from conversation_participants'
-- own RLS as the table owner) so policies can call it without the
-- self-referential recursion a plain subquery on the same table
-- would otherwise cause.
create or replace function public.is_conversation_participant(p_conversation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.conversation_participants cp
    where cp.conversation_id = p_conversation_id and cp.user_id = auth.uid()
  );
$$;

grant execute on function public.is_conversation_participant(uuid) to authenticated;

-- Denormalizes last_message_at/last_message_preview onto the parent
-- conversation whenever a message is inserted.
create or replace function public.touch_conversation_on_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.conversations
  set last_message_at = new.created_at,
      last_message_preview = left(new.body, 140)
  where id = new.conversation_id;
  return new;
end;
$$;

drop trigger if exists messages_touch_conversation on public.messages;
create trigger messages_touch_conversation
  after insert on public.messages
  for each row execute function public.touch_conversation_on_message();

-- Starts (or reuses) a conversation between the signed-in user and a
-- recipient for a given context, and sends the first message —
-- atomically, as one call, so the client never has to orchestrate a
-- 3-table insert (and can't leave an empty/participant-less
-- conversation behind on a partial failure).
create or replace function public.start_conversation(
  p_context_type text,
  p_context_id uuid,
  p_recipient_id uuid,
  p_recipient_role text,
  p_subject text,
  p_message text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_conversation_id uuid;
begin
  if v_user is null then
    raise exception 'Sign in required';
  end if;
  if p_recipient_id is null or p_recipient_id = v_user then
    raise exception 'Invalid recipient';
  end if;
  if p_message is null or length(trim(p_message)) = 0 then
    raise exception 'Message cannot be empty';
  end if;

  select c.id into v_conversation_id
  from public.conversations c
  where c.context_type is not distinct from p_context_type
    and c.context_id is not distinct from p_context_id
    and exists (
      select 1 from public.conversation_participants cp
      where cp.conversation_id = c.id and cp.user_id = v_user
    )
    and exists (
      select 1 from public.conversation_participants cp
      where cp.conversation_id = c.id and cp.user_id = p_recipient_id
    )
  limit 1;

  if v_conversation_id is null then
    insert into public.conversations (context_type, context_id, subject)
    values (p_context_type, p_context_id, p_subject)
    returning id into v_conversation_id;

    insert into public.conversation_participants (conversation_id, user_id, role)
    values
      (v_conversation_id, v_user, 'customer'),
      (v_conversation_id, p_recipient_id, coalesce(p_recipient_role, 'vendor'));
  end if;

  insert into public.messages (conversation_id, sender_id, body)
  values (v_conversation_id, v_user, p_message);

  return v_conversation_id;
end;
$$;

grant execute on function public.start_conversation(text, uuid, uuid, text, text, text) to authenticated;

-- Per-conversation unread counts for the signed-in user (drives the
-- inbox list's unread indicators and the sidebar nav badge).
create or replace function public.get_conversation_unread_counts(p_user_id uuid)
returns table (conversation_id uuid, unread_count bigint)
language sql
stable
security definer
set search_path = public
as $$
  select m.conversation_id, count(*)::bigint as unread_count
  from public.messages m
  join public.conversation_participants cp
    on cp.conversation_id = m.conversation_id and cp.user_id = p_user_id
  where m.sender_id <> p_user_id
    and m.created_at > coalesce(cp.last_read_at, 'epoch'::timestamptz)
  group by m.conversation_id;
$$;

grant execute on function public.get_conversation_unread_counts(uuid) to authenticated;

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.conversations enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.messages enable row level security;
alter table public.message_attachments enable row level security;
alter table public.event_reviews enable row level security;

-- Conversations/participants/messages are only ever written through
-- the SECURITY DEFINER functions above (which run as the owner and
-- so bypass RLS) — the policies below only need to cover reads, plus
-- the couple of updates a participant makes directly (marking read,
-- editing their own message).

create policy "participants can view their conversations"
  on public.conversations for select
  using (public.is_conversation_participant(id));

create policy "participants can view conversation_participants"
  on public.conversation_participants for select
  using (public.is_conversation_participant(conversation_id));

create policy "participants can update their own participant row"
  on public.conversation_participants for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "participants can view messages"
  on public.messages for select
  using (public.is_conversation_participant(conversation_id));

create policy "participants can send messages"
  on public.messages for insert
  with check (sender_id = auth.uid() and public.is_conversation_participant(conversation_id));

create policy "senders can edit their own messages"
  on public.messages for update
  using (sender_id = auth.uid())
  with check (sender_id = auth.uid());

create policy "participants can view message attachments"
  on public.message_attachments for select
  using (
    exists (
      select 1 from public.messages m
      where m.id = message_attachments.message_id
        and public.is_conversation_participant(m.conversation_id)
    )
  );

create policy "senders can attach files to their own messages"
  on public.message_attachments for insert
  with check (
    exists (
      select 1 from public.messages m
      where m.id = message_attachments.message_id and m.sender_id = auth.uid()
    )
  );

-- Reviews: readable whenever the parent is readable (published
-- reviews only, to the public; a user can also always see their own
-- hidden/moderated review). Writable by the author, gated by a
-- completed booking on insert.

create policy "event reviews readable when parent event is readable"
  on public.event_reviews for select
  using (
    (
      status = 'published'
      and exists (
        select 1 from public.events e
        where e.id = event_reviews.event_id
          and e.status = 'published' and e.visibility = 'public'
      )
    )
    or user_id = auth.uid()
  );

create policy "eligible users can create event reviews"
  on public.event_reviews for insert
  with check (auth.uid() = user_id and public.has_completed_event_booking(event_id, auth.uid()));

create policy "users can update their own event reviews"
  on public.event_reviews for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users can delete their own event reviews"
  on public.event_reviews for delete
  using (auth.uid() = user_id);

-- Tighten venue_reviews / vendor_reviews: Phase 04/05 shipped a
-- single permissive "manage your own" policy with a note that Phase
-- 11 would add eligibility checks. Replace it with insert/update/
-- delete split so insert can require a completed booking.

drop policy if exists "users manage their own venue reviews" on public.venue_reviews;
drop policy if exists "venue reviews readable when parent venue is readable" on public.venue_reviews;

create policy "venue reviews readable when parent venue is readable"
  on public.venue_reviews for select
  using (
    (
      status = 'published'
      and exists (
        select 1 from public.venues v
        where v.id = venue_reviews.venue_id
          and v.status = 'published' and v.visibility = 'public'
      )
    )
    or user_id = auth.uid()
  );

create policy "eligible users can create venue reviews"
  on public.venue_reviews for insert
  with check (auth.uid() = user_id and public.has_completed_venue_booking(venue_id, auth.uid()));

create policy "users can update their own venue reviews"
  on public.venue_reviews for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users can delete their own venue reviews"
  on public.venue_reviews for delete
  using (auth.uid() = user_id);

drop policy if exists "users manage their own vendor reviews" on public.vendor_reviews;

create policy "eligible users can create vendor reviews"
  on public.vendor_reviews for insert
  with check (auth.uid() = user_id and public.has_completed_vendor_booking(vendor_id, auth.uid()));

create policy "users can update their own vendor reviews"
  on public.vendor_reviews for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users can delete their own vendor reviews"
  on public.vendor_reviews for delete
  using (auth.uid() = user_id);

-- The original "vendor reviews readable..." SELECT policy from Phase
-- 05 didn't filter on status; replace it so it also honors
-- moderation, same shape as the venue/event policies above.
drop policy if exists "vendor reviews readable when parent vendor is readable" on public.vendor_reviews;

create policy "vendor reviews readable when parent vendor is readable"
  on public.vendor_reviews for select
  using (
    (
      status = 'published'
      and exists (
        select 1 from public.vendors v
        where v.id = vendor_reviews.vendor_id
          and v.status = 'published' and v.visibility = 'public'
      )
    )
    or user_id = auth.uid()
  );
