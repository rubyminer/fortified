-- Calendaring: scheduled sessions, scheduling prefs on profiles, push subscriptions
-- Run after 008_realtime_broadcast.sql

-- ---------------------------------------------------------------------------
-- profiles: scheduling + notification prefs (insert policy restored for signup)
-- ---------------------------------------------------------------------------

alter table profiles
  add column if not exists primary_training_days text[] default '{}',
  add column if not exists supplemental_timing text
    check (
      supplemental_timing is null
      or supplemental_timing in ('same_day_before', 'same_day_after', 'different_days')
    ),
  add column if not exists supplemental_days text[] default '{}',
  add column if not exists preferred_workout_time time default '07:00:00',
  add column if not exists cycle_start_date date,
  add column if not exists notify_day_before boolean default true,
  add column if not exists notify_hour_before boolean default true,
  add column if not exists notification_timezone text default 'UTC';

drop policy if exists "profiles_own_insert" on profiles;
create policy "profiles_own_insert" on profiles
  for insert with check (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- scheduled_sessions
-- ---------------------------------------------------------------------------

create table if not exists scheduled_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  workout_id text not null references workouts(id),
  scheduled_date date not null,
  preferred_time time,
  is_flex_day boolean not null default false,
  is_confirmed boolean not null default false,
  completed boolean not null default false,
  completed_session_id uuid references sessions(id),
  notification_day_before_sent boolean not null default false,
  notification_hour_before_sent boolean not null default false,
  rescheduled_from date,
  created_at timestamptz not null default now(),
  unique (user_id, workout_id, scheduled_date)
);

create index if not exists scheduled_sessions_user_date_idx
  on scheduled_sessions (user_id, scheduled_date);

create index if not exists scheduled_sessions_date_idx
  on scheduled_sessions (scheduled_date);

alter table scheduled_sessions enable row level security;

create policy "scheduled_sessions_select_own" on scheduled_sessions
  for select using (auth.uid() = user_id);

create policy "scheduled_sessions_insert_own" on scheduled_sessions
  for insert with check (auth.uid() = user_id);

create policy "scheduled_sessions_update_own" on scheduled_sessions
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "scheduled_sessions_delete_own" on scheduled_sessions
  for delete using (auth.uid() = user_id);

create policy "scheduled_sessions_admin_read" on scheduled_sessions
  for select using (public.is_admin_user());

-- ---------------------------------------------------------------------------
-- push_subscriptions (Web Push) — backend uses service role to read all
-- ---------------------------------------------------------------------------

create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now(),
  unique (user_id, endpoint)
);

create index if not exists push_subscriptions_user_idx on push_subscriptions (user_id);

alter table push_subscriptions enable row level security;

create policy "push_subscriptions_own_select" on push_subscriptions
  for select using (auth.uid() = user_id);

create policy "push_subscriptions_own_insert" on push_subscriptions
  for insert with check (auth.uid() = user_id);

create policy "push_subscriptions_own_update" on push_subscriptions
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "push_subscriptions_own_delete" on push_subscriptions
  for delete using (auth.uid() = user_id);

create policy "push_subscriptions_admin_read" on push_subscriptions
  for select using (public.is_admin_user());
