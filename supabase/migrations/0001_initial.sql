create extension if not exists pgcrypto;

create table if not exists public.allowed_users (
  email text primary key,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

create table if not exists public.alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  origin text not null check (char_length(origin) = 3),
  destination text not null check (char_length(destination) = 3),
  is_round_trip boolean not null default true,
  departure_date date not null,
  return_date date,
  flex_days smallint not null default 0 check (flex_days between 0 and 3),
  max_price numeric(10,2) not null check (max_price > 0),
  active boolean not null default true,
  best_price numeric(10,2),
  last_checked_at timestamptz,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  constraint return_required_for_round_trip check (not is_round_trip or return_date is not null)
);

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  unique (user_id, endpoint)
);

create table if not exists public.notification_dispatches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  dispatch_date date not null,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  unique (user_id, dispatch_date)
);

create index if not exists alerts_user_active_idx on public.alerts (user_id, active);
create index if not exists alerts_scan_idx on public.alerts (active, departure_date) where active = true;

alter table public.allowed_users enable row level security;
alter table public.alerts enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.notification_dispatches enable row level security;

create policy "Users read their allowlist entry" on public.allowed_users for select to authenticated using (lower(email) = lower(auth.jwt() ->> 'email'));
create policy "Users read own alerts" on public.alerts for select to authenticated using (auth.uid() = user_id);
create policy "Users create own alerts" on public.alerts for insert to authenticated with check (auth.uid() = user_id);
create policy "Users update own alerts" on public.alerts for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users delete own alerts" on public.alerts for delete to authenticated using (auth.uid() = user_id);
create policy "Users read own push subscriptions" on public.push_subscriptions for select to authenticated using (auth.uid() = user_id);
create policy "Users create own push subscriptions" on public.push_subscriptions for insert to authenticated with check (auth.uid() = user_id);
create policy "Users update own push subscriptions" on public.push_subscriptions for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users delete own push subscriptions" on public.push_subscriptions for delete to authenticated using (auth.uid() = user_id);