-- Run once in the Supabase SQL editor. Create the owner in Auth first.
create table public.admin_users (user_id uuid primary key references auth.users(id) on delete cascade);
alter table public.admin_users enable row level security;
create policy "Owner can read own membership" on public.admin_users for select to authenticated using (user_id = auth.uid());
create function public.is_admin() returns boolean language sql stable security definer set search_path = public as $$ select exists(select 1 from public.admin_users where user_id = auth.uid()) $$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;
create table public.photos (
 id uuid primary key default gen_random_uuid(),
 title text not null check(char_length(title) between 1 and 160),
 description text not null default '' check(char_length(description) <= 1000),
 category text not null check(category in ('Weddings','Pre-Wedding','Birthdays','Portraits','Engagements','Events','Maternity','Fashion & Creative')),
 url text not null check(url like 'https://%'),
 featured boolean not null default false,
 published boolean not null default false,
 created_at timestamptz not null default now()
);
create table public.events (
 id uuid primary key default gen_random_uuid(),
 title text not null check(char_length(title) between 1 and 160),
 date timestamptz not null,
 location text not null check(char_length(location) <= 300),
 description text not null check(char_length(description) <= 3000),
 cover_url text,
 images jsonb not null default '[]'::jsonb,
 published boolean not null default false
);
create table public.settings (id integer primary key check(id=1), data jsonb not null default '{}'::jsonb);
alter table public.photos enable row level security;
alter table public.events enable row level security;
alter table public.settings enable row level security;
create policy "Published photographs are public" on public.photos for select using (published or public.is_admin());
create policy "Owner manages photographs" on public.photos for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy "Published events are public" on public.events for select using(published or public.is_admin());
create policy "Owner manages events" on public.events for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy "Contact details are public" on public.settings for select using(true);
create policy "Owner manages settings" on public.settings for all to authenticated using(public.is_admin()) with check(public.is_admin());
grant select on public.photos, public.events, public.settings to anon;
grant select on public.admin_users to authenticated;
grant select, insert, update, delete on public.photos, public.events, public.settings to authenticated;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values ('photos','photos',true,10485760,array['image/jpeg','image/png','image/webp']);
create policy "Public photo viewing" on storage.objects for select using(bucket_id='photos');
create policy "Owner uploads photos" on storage.objects for insert to authenticated with check(bucket_id='photos' and public.is_admin());
create policy "Owner replaces photos" on storage.objects for update to authenticated using(bucket_id='photos' and public.is_admin()) with check(bucket_id='photos' and public.is_admin());
create policy "Owner deletes photos" on storage.objects for delete to authenticated using(bucket_id='photos' and public.is_admin());
-- After creating your owner in Authentication > Users, run:
-- insert into public.admin_users(user_id) values ('OWNER_AUTH_USER_UUID');
-- Disable new-user registration in Supabase Authentication settings.
