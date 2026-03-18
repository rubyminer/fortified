-- Fortify — Migration 005
-- Renames "sport" to "discipline" throughout the schema to match updated product terminology.

-- Rename the top-level lookup table
ALTER TABLE sports RENAME TO disciplines;

-- Rename the sport column to discipline in all dependent tables
ALTER TABLE profiles RENAME COLUMN sport TO discipline;
ALTER TABLE subtracks RENAME COLUMN sport TO discipline;
ALTER TABLE workouts RENAME COLUMN sport TO discipline;
ALTER TABLE sessions RENAME COLUMN sport TO discipline;

-- Rename the FK constraint on subtracks to match the new column name
ALTER TABLE subtracks RENAME CONSTRAINT subtracks_sport_fk TO subtracks_discipline_fk;
