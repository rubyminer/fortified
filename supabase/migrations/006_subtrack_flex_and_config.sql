-- Flex day columns on workouts + subtrack_config (programming metadata per track)

alter table workouts
  add column if not exists is_flex_day boolean not null default false,
  add column if not exists flex_day_type text,
  add column if not exists flex_day_note text;

alter table workouts drop constraint if exists workouts_flex_day_type_check;
alter table workouts add constraint workouts_flex_day_type_check
  check (flex_day_type is null or flex_day_type in ('volume', 'technique', 'recovery'));

create table if not exists subtrack_config (
  id text primary key,
  discipline text not null references disciplines(id) on delete restrict,
  subtrack text not null references subtracks(id) on delete restrict,
  display_name text not null,
  base_days_per_week int not null default 2,
  flex_days_per_week int not null default 0,
  total_weeks int not null default 4,
  description text,
  who_its_for text,
  created_at timestamptz default now(),
  unique (discipline, subtrack)
);

create index if not exists workouts_flex_idx
  on workouts (discipline, subtrack, week_number, is_flex_day);

create index if not exists subtrack_config_discipline_idx
  on subtrack_config (discipline);

alter table subtrack_config enable row level security;

create policy "subtrack_config_public_read" on subtrack_config
  for select using (true);

create policy "subtrack_config_admin_insert" on subtrack_config
  for insert with check (public.is_admin_user());

create policy "subtrack_config_admin_update" on subtrack_config
  for update using (public.is_admin_user()) with check (public.is_admin_user());

create policy "subtrack_config_admin_delete" on subtrack_config
  for delete using (public.is_admin_user());
