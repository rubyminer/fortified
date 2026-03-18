-- Fortify App — Initial Schema
-- Run this against your Supabase project via the SQL editor or CLI

-- Profiles (extends Supabase auth.users)
create table profiles (
  id uuid references auth.users primary key,
  name text not null,
  sport text not null,
  subtrack text not null,
  level text not null,
  frequency int not null,
  is_beta boolean default true,
  created_at timestamptz default now()
);
alter table profiles enable row level security;
create policy "profiles_own" on profiles for all using (auth.uid() = id);

-- Workout sessions
create table sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  sport text not null,
  subtrack text not null,
  week_number int not null,
  day_number int not null,
  workout_id text not null,
  notes text,
  completed_at timestamptz default now()
);
alter table sessions enable row level security;
create policy "sessions_own" on sessions for all using (auth.uid() = user_id);

-- Set logs
create table set_logs (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade,
  exercise_name text not null,
  movement_id text,
  set_number int not null,
  weight_lbs numeric,
  reps int,
  rpe_actual numeric,
  logged_at timestamptz default now()
);
alter table set_logs enable row level security;
create policy "set_logs_own" on set_logs for all using (
  auth.uid() = (select user_id from sessions where id = session_id)
);

-- Personal records
create table personal_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  movement text not null,
  weight_lbs numeric not null,
  notes text,
  achieved_at date not null,
  created_at timestamptz default now()
);
alter table personal_records enable row level security;
create policy "prs_own" on personal_records for all using (auth.uid() = user_id);

-- Movement library
create table movements (
  id text primary key,
  name text not null,
  category text not null,
  subcategory text,
  tags text[] default '{}',
  youtube_url text,
  youtube_embed_id text,
  cue_points text[],
  description text,
  difficulty text,
  equipment text[],
  primary_muscles text[],
  secondary_muscles text[],
  is_active boolean default true,
  created_at timestamptz default now()
);
alter table movements enable row level security;
create policy "movements_public_read" on movements for select using (true);

-- Workout templates
create table workouts (
  id text primary key,
  sport text not null,
  subtrack text not null,
  week_number int not null,
  day_number int not null,
  title text not null,
  coach_note text,
  warmup jsonb,
  main_work jsonb,
  accessory jsonb,
  created_at timestamptz default now()
);
alter table workouts enable row level security;
create policy "workouts_public_read" on workouts for select using (true);

-- Community chat
create table chat_messages (
  id uuid primary key default gen_random_uuid(),
  subtrack text not null,
  user_id uuid references profiles(id) on delete cascade,
  author_name text not null,
  content text not null,
  is_coach boolean default false,
  is_pinned boolean default false,
  created_at timestamptz default now()
);
alter table chat_messages enable row level security;
create policy "chat_read" on chat_messages for select using (true);
create policy "chat_insert_own" on chat_messages for insert with check (auth.uid() = user_id);

-- Feed likes
create table feed_likes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  feed_item_id text not null,
  created_at timestamptz default now(),
  unique(user_id, feed_item_id)
);
alter table feed_likes enable row level security;
create policy "likes_read" on feed_likes for select using (true);
create policy "likes_own" on feed_likes for all using (auth.uid() = user_id);

-- Indexes for performance
create index sessions_user_id_idx on sessions(user_id);
create index sessions_workout_id_idx on sessions(workout_id);
create index set_logs_session_id_idx on set_logs(session_id);
create index personal_records_user_id_idx on personal_records(user_id);
create index chat_messages_subtrack_idx on chat_messages(subtrack);
create index chat_messages_created_at_idx on chat_messages(created_at desc);
create index feed_likes_user_id_idx on feed_likes(user_id);
create index workouts_sport_subtrack_idx on workouts(sport, subtrack);

-- Enable Supabase Realtime on key tables
alter publication supabase_realtime add table chat_messages;
alter publication supabase_realtime add table sessions;
