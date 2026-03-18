-- Fortify — Migration 003
-- Creates the dynamic subtracks table so new subtracks can be managed from the admin panel
-- and loaded in the Fortify app without a code deploy.

create table if not exists subtracks (
  id          text primary key,
  sport       text not null check (sport in ('crossfit', 'hyrox', 'athx')),
  name        text not null,
  description text,
  is_active   boolean default true,
  sort_order  int default 0,
  created_at  timestamptz default now()
);

alter table subtracks enable row level security;

-- Everyone (including anon) can read subtracks
create policy "subtracks_public_read" on subtracks
  for select using (true);

-- Admins can create / update / delete subtracks
create policy "subtracks_admin_write" on subtracks
  for all using (public.is_admin_user());

-- Seed with the 9 original subtracks (safe to re-run)
insert into subtracks (id, sport, name, description, sort_order) values
  ('overhead_shoulder_strength', 'crossfit', 'Overhead & Shoulder', 'Press strength and stability', 1),
  ('lower_body_strength',        'crossfit', 'Lower Body Strength', 'Squat and hinge patterns', 2),
  ('engine_builder',             'crossfit', 'Engine Builder',       'Aerobic capacity and pacing', 3),
  ('sled_carry_strength',        'hyrox',    'Sled & Carry Strength','Push/pull force production', 1),
  ('running_economy',            'hyrox',    'Running Economy',      'Efficiency and stride mechanics', 2),
  ('upper_body_push',            'hyrox',    'Upper Body Push',      'Chest and shoulder endurance', 3),
  ('explosive_power',            'athx',     'Explosive Power',      'Speed-strength and plyometrics', 1),
  ('maximal_strength',           'athx',     'Maximal Strength',     'Peak force development', 2),
  ('conditioning',               'athx',     'Conditioning',         'Work capacity and recovery', 3)
on conflict (id) do nothing;
