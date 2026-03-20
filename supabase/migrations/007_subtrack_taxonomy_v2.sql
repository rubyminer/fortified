-- Approach B: replace legacy subtrack slugs with the 12-track taxonomy.
-- Safe when subtrack_config is still empty (seed loads config after this migration).

-- Workouts
update workouts set subtrack = 'muscular_endurance'
  where discipline = 'crossfit' and subtrack = 'engine_builder';
update workouts set subtrack = 'running_economy_strength'
  where discipline = 'hyrox' and subtrack = 'running_economy';
update workouts set subtrack = 'station_specific_strength'
  where discipline = 'hyrox' and subtrack = 'upper_body_push';
update workouts set subtrack = 'posterior_chain_hinge'
  where discipline = 'athx' and subtrack = 'maximal_strength';
update workouts set subtrack = 'upper_body_power'
  where discipline = 'athx' and subtrack = 'conditioning';

-- Profiles (no-op if table empty)
update profiles set subtrack = 'muscular_endurance'
  where discipline = 'crossfit' and subtrack = 'engine_builder';
update profiles set subtrack = 'running_economy_strength'
  where discipline = 'hyrox' and subtrack = 'running_economy';
update profiles set subtrack = 'station_specific_strength'
  where discipline = 'hyrox' and subtrack = 'upper_body_push';
update profiles set subtrack = 'posterior_chain_hinge'
  where discipline = 'athx' and subtrack = 'maximal_strength';
update profiles set subtrack = 'upper_body_power'
  where discipline = 'athx' and subtrack = 'conditioning';

-- Sessions (historical rows)
update sessions set subtrack = 'muscular_endurance'
  where discipline = 'crossfit' and subtrack = 'engine_builder';
update sessions set subtrack = 'running_economy_strength'
  where discipline = 'hyrox' and subtrack = 'running_economy';
update sessions set subtrack = 'station_specific_strength'
  where discipline = 'hyrox' and subtrack = 'upper_body_push';
update sessions set subtrack = 'posterior_chain_hinge'
  where discipline = 'athx' and subtrack = 'maximal_strength';
update sessions set subtrack = 'upper_body_power'
  where discipline = 'athx' and subtrack = 'conditioning';

-- Chat messages keyed by subtrack slug
update chat_messages set subtrack = 'running_economy_strength' where subtrack = 'running_economy';
update chat_messages set subtrack = 'station_specific_strength' where subtrack = 'upper_body_push';

delete from subtracks;

insert into subtracks (id, discipline, name, description, sort_order, is_active) values
  ('lower_body_strength', 'crossfit', 'Lower Body Strength', 'Squat and hinge patterns', 1, true),
  ('overhead_shoulder_strength', 'crossfit', 'Overhead & Shoulder Strength', 'Press strength and stability', 2, true),
  ('pulling_strength', 'crossfit', 'Pulling Strength', 'Horizontal and vertical pulling strength', 3, true),
  ('muscular_endurance', 'crossfit', 'Muscular Endurance', 'Barbell cycling and muscular endurance', 4, true),

  ('sled_carry_strength', 'hyrox', 'Sled & Loaded Carry Strength', 'Hip drive and loaded carries', 1, true),
  ('running_economy_strength', 'hyrox', 'Running Economy Strength', 'Single-leg and running-specific strength', 2, true),
  ('station_specific_strength', 'hyrox', 'Station-Specific Strength', 'SkiErg, row, wall ball, and race stations', 3, true),
  ('strength_endurance', 'hyrox', 'Strength Endurance', 'Repeatable strength across race distance', 4, true),

  ('explosive_power', 'athx', 'Explosive Power', 'Olympic variations and plyometrics', 1, true),
  ('posterior_chain_hinge', 'athx', 'Posterior Chain & Hinge', 'Deadlift patterns and hip extension', 2, true),
  ('upper_body_power', 'athx', 'Upper Body Power', 'Push and pull power for ATHX', 3, true),
  ('competition_prep', 'athx', 'Competition Prep', 'Peaking block for event day', 4, true);
