-- Add business_hours, social_media, payment_settings and pix_key columns to restaurants table
alter table public.restaurants
add column if not exists business_hours jsonb default null;

alter table public.restaurants
add column if not exists social_media jsonb default null;

alter table public.restaurants
add column if not exists payment_settings jsonb default null;

alter table public.restaurants
add column if not exists pix_key varchar default null;

-- Create indexes for faster queries (optional)
create index if not exists idx_restaurants_business_hours on public.restaurants using gin (business_hours);
create index if not exists idx_restaurants_social_media on public.restaurants using gin (social_media);
create index if not exists idx_restaurants_payment_settings on public.restaurants using gin (payment_settings);
create index if not exists idx_restaurants_pix_key on public.restaurants (pix_key);
