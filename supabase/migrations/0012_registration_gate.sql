-- ============================================================
-- Phase 12 (part 2) — enforce "Allow new sign-ups" at the database
-- Run in the Supabase SQL editor AFTER 0011.
--
-- The Register page is hidden when an admin turns sign-ups off, but the
-- Supabase Auth API can still be called directly. This trigger makes the
-- switch real: while it is off, creating a new profile (i.e. a new user)
-- fails. Existing users are unaffected.
-- ============================================================

create or replace function public.enforce_registration_open()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if exists (
    select 1 from public.site_settings
    where key = 'platform' and value ->> 'allow_registration' = 'false'
  ) then
    raise exception 'New sign-ups are currently closed.';
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_registration_open on public.profiles;
create trigger enforce_registration_open
  before insert on public.profiles
  for each row execute function public.enforce_registration_open();
