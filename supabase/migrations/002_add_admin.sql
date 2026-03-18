-- Fortify Admin — Migration 002
-- Run this in the Supabase SQL editor after 001_initial.sql
--
-- After applying, grant yourself admin access:
--   update profiles
--   set is_admin = true
--   where id = (select id from auth.users where email = 'your-email@example.com');

-- Add is_admin column to profiles
alter table profiles add column if not exists is_admin boolean default false;

-- Helper function that checks admin status WITHOUT triggering RLS recursion.
-- security definer runs as postgres superuser, bypassing RLS on the inner profiles query.
create or replace function public.is_admin_user()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(
    (select is_admin from profiles where id = auth.uid()),
    false
  );
$$;

-- Drop existing profile policy and replace with split read/update policies
drop policy if exists "profiles_own" on profiles;

-- Regular users: read and update their own row only
create policy "profiles_own_read" on profiles
  for select using (auth.uid() = id);

create policy "profiles_own_update" on profiles
  for update using (auth.uid() = id);

-- Admins: read all profiles
create policy "profiles_admin_read" on profiles
  for select using (public.is_admin_user());

-- Admins: update any profile
create policy "profiles_admin_update" on profiles
  for update using (public.is_admin_user());

-- Admins: read all sessions
drop policy if exists "sessions_own" on sessions;

create policy "sessions_own" on sessions
  for all using (auth.uid() = user_id);

create policy "sessions_admin_read" on sessions
  for select using (public.is_admin_user());

-- Admins: read all personal records
drop policy if exists "prs_own" on personal_records;

create policy "prs_own" on personal_records
  for all using (auth.uid() = user_id);

create policy "prs_admin_read" on personal_records
  for select using (public.is_admin_user());

-- Admins: delete and update chat messages (moderation)
create policy "chat_admin_delete" on chat_messages
  for delete using (public.is_admin_user());

create policy "chat_admin_update" on chat_messages
  for update using (public.is_admin_user());

-- Admins: full write access to workouts and movements
create policy "workouts_admin_write" on workouts
  for all using (public.is_admin_user());

create policy "movements_admin_write" on movements
  for all using (public.is_admin_user());
