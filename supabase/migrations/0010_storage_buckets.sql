-- Phase: Image uploads (event/venue/vendor cover photos)
-- Creates a public "images" bucket and RLS-style storage policies:
-- anyone can view, only signed-in users can upload, and a user may
-- only modify/delete files they uploaded.

insert into storage.buckets (id, name, public)
values ('images', 'images', true)
on conflict (id) do nothing;

drop policy if exists "images are publicly readable" on storage.objects;
create policy "images are publicly readable"
  on storage.objects for select
  using (bucket_id = 'images');

drop policy if exists "authenticated users can upload images" on storage.objects;
create policy "authenticated users can upload images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'images');

drop policy if exists "owners can update their images" on storage.objects;
create policy "owners can update their images"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'images' and owner = auth.uid());

drop policy if exists "owners can delete their images" on storage.objects;
create policy "owners can delete their images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'images' and owner = auth.uid());
