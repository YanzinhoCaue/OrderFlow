-- Buckets for restaurant branding assets
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('restaurant-logos', 'restaurant-logos', true, 8388608, array['image/jpeg','image/jpg','image/png','image/webp']),
  ('restaurant-covers', 'restaurant-covers', true, 16777216, array['image/jpeg','image/jpg','image/png','image/webp'])
on conflict (id) do nothing;

-- Public read for branding assets
create policy "Public read restaurant branding" on storage.objects
  for select using (bucket_id in ('restaurant-logos','restaurant-covers'));

-- Authenticated users can upload to branding buckets (API validates ownership)
create policy "Authenticated users insert branding" on storage.objects
  for insert with check (
    bucket_id in ('restaurant-logos','restaurant-covers')
    and auth.role() = 'authenticated'
  );

-- Authenticated users can update their branding objects
create policy "Authenticated users update branding" on storage.objects
  for update using (
    bucket_id in ('restaurant-logos','restaurant-covers')
    and auth.role() = 'authenticated'
  ) with check (
    bucket_id in ('restaurant-logos','restaurant-covers')
    and auth.role() = 'authenticated'
  );

-- Authenticated users can delete their branding objects
create policy "Authenticated users delete branding" on storage.objects
  for delete using (
    bucket_id in ('restaurant-logos','restaurant-covers')
    and auth.role() = 'authenticated'
  );
