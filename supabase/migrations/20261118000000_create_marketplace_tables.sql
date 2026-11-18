create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 2 and 120),
  price numeric(12, 2) not null check (price >= 0),
  category text not null check (char_length(btrim(category)) between 1 and 80),
  location text not null check (char_length(btrim(location)) between 1 and 160),
  seller_name text not null check (char_length(btrim(seller_name)) between 1 and 120),
  seller_email text not null check (char_length(btrim(seller_email)) between 3 and 320),
  seller_address text not null check (char_length(btrim(seller_address)) between 1 and 240),
  seller_phone text not null check (char_length(btrim(seller_phone)) between 3 and 40),
  description text not null check (char_length(btrim(description)) between 5 and 2000),
  image_path text not null,
  created_at timestamptz not null default now()
);

alter table public.listings enable row level security;

create index if not exists listings_created_at_idx
  on public.listings (created_at desc);
create index if not exists listings_category_idx
  on public.listings (category);

grant usage on schema public to anon, authenticated;
grant select, insert on public.listings to anon, authenticated;

drop policy if exists "Public can read marketplace listings" on public.listings;
create policy "Public can read marketplace listings"
  on public.listings for select
  to anon, authenticated
  using (true);

drop policy if exists "Anyone can create marketplace listings" on public.listings;
create policy "Anyone can create marketplace listings"
  on public.listings for insert
  to anon, authenticated
  with check (true);

create table if not exists public.listing_inquiries (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  buyer_email text not null check (char_length(btrim(buyer_email)) between 3 and 320),
  message text not null check (char_length(btrim(message)) between 2 and 2000),
  created_at timestamptz not null default now()
);

alter table public.listing_inquiries enable row level security;

revoke all on public.listing_inquiries from anon, authenticated;
grant insert on public.listing_inquiries to anon, authenticated;

drop policy if exists "Anyone can submit a listing inquiry" on public.listing_inquiries;
create policy "Anyone can submit a listing inquiry"
  on public.listing_inquiries for insert
  to anon, authenticated
  with check (
    exists (
      select 1
      from public.listings
      where listings.id = listing_inquiries.listing_id
    )
  );

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'marketplace-listings',
  'marketplace-listings',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can read marketplace listing images" on storage.objects;
create policy "Public can read marketplace listing images"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'marketplace-listings');

drop policy if exists "Anyone can upload marketplace listing images" on storage.objects;
create policy "Anyone can upload marketplace listing images"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'marketplace-listings');

drop policy if exists "Anyone can remove unused marketplace listing images" on storage.objects;
create policy "Anyone can remove unused marketplace listing images"
  on storage.objects for delete
  to anon, authenticated
  using (
    bucket_id = 'marketplace-listings'
    and not exists (
      select 1
      from public.listings
      where listings.image_path = storage.objects.name
    )
  );
