-- DOFree v2 core schema
-- Run this migration after confirming the correct Supabase project.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  role text not null default 'member' check (role in ('member', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tmdb_id integer not null,
  media_type text not null check (media_type in ('movie', 'tv')),
  title text not null,
  poster_url text,
  backdrop_url text,
  rating text,
  year text,
  created_at timestamptz not null default now(),
  unique (user_id, tmdb_id, media_type)
);

create table if not exists public.watch_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  tmdb_id integer not null,
  media_type text not null check (media_type in ('movie', 'tv')),
  title text not null,
  trailer_key text,
  progress_seconds integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan text not null default 'free' check (plan in ('free', 'premium')),
  status text not null default 'inactive' check (status in ('inactive', 'pending', 'active', 'expired')),
  slip_url text,
  started_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  body text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.favorites enable row level security;
alter table public.watch_history enable row level security;
alter table public.memberships enable row level security;
alter table public.notifications enable row level security;

create policy if not exists "Profiles are readable by owner" on public.profiles
  for select using (auth.uid() = id);

create policy if not exists "Users can update their profile" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

create policy if not exists "Users can insert their profile" on public.profiles
  for insert with check (auth.uid() = id);

create policy if not exists "Users manage their favorites" on public.favorites
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy if not exists "Users manage their watch history" on public.watch_history
  for all using (auth.uid() = user_id or user_id is null) with check (auth.uid() = user_id or user_id is null);

create policy if not exists "Users read their memberships" on public.memberships
  for select using (auth.uid() = user_id);

create policy if not exists "Users create pending membership" on public.memberships
  for insert with check (auth.uid() = user_id);

create policy if not exists "Users read their notifications" on public.notifications
  for select using (auth.uid() = user_id or user_id is null);

create index if not exists favorites_user_id_idx on public.favorites(user_id);
create index if not exists favorites_tmdb_idx on public.favorites(tmdb_id, media_type);
create index if not exists watch_history_user_id_idx on public.watch_history(user_id);
create index if not exists memberships_user_id_idx on public.memberships(user_id);
create index if not exists notifications_user_id_idx on public.notifications(user_id);
