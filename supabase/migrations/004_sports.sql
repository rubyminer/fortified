-- Fortify — Migration 004
-- Creates a dynamic sports table so new sports can be managed from the admin panel.
-- Removes the hardcoded CHECK constraint on subtracks.sport and replaces it with
-- a FK reference to sports.id so new sports work end-to-end without code changes.

create table if not exists sports (
  id          text primary key,
  label       text not null,
  tagline     text,
  cycle_weeks int default 4,
  days_min    int default 2,
  days_max    int default 3,
  is_active   boolean default true,
  sort_order  int default 0,
  created_at  timestamptz default now()
);

alter table sports enable row level security;

create policy "sports_public_read" on sports
  for select using (true);

create policy "sports_admin_write" on sports
  for all using (public.is_admin_user());

-- Seed the three existing sports (safe to re-run)
insert into sports (id, label, tagline, cycle_weeks, days_min, days_max, sort_order) values
  ('crossfit', 'CrossFit', 'Functional fitness for the broad and well-rounded athlete', 4, 2, 3, 1),
  ('hyrox',    'Hyrox',    'Race-specific strength for competitive Hyrox athletes',     5, 2, 3, 2),
  ('athx',     'ATHX',     'Multi-modal power and conditioning for ATHX competition',   6, 3, 4, 3)
on conflict (id) do nothing;

-- Drop the hardcoded check constraint so subtracks can reference any sport
alter table subtracks drop constraint if exists subtracks_sport_check;

-- Add FK so every subtrack must reference a valid sport row
alter table subtracks
  add constraint subtracks_sport_fk
  foreign key (sport) references sports(id) on delete restrict;
