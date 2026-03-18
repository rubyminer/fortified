export type Sport = 'crossfit' | 'hyrox' | 'athx';
export type Level = 'beginner' | 'intermediate' | 'advanced';

export interface Profile {
  id: string;
  name: string;
  sport: Sport;
  subtrack: string;
  level: Level;
  frequency: number;
  is_beta: boolean;
  created_at: string;
}

export interface WorkoutExercise {
  movement_id: string;
  name: string;
  sets: number;
  reps: string;
  rpe_target: number;
  rest_seconds: number;
  description: string;
}

export interface Workout {
  id: string;
  sport: Sport;
  subtrack: string;
  week_number: number;
  day_number: number;
  title: string;
  coach_note: string | null;
  warmup: string[] | null;
  main_work: WorkoutExercise[] | null;
  accessory: WorkoutExercise[] | null;
  created_at: string;
}

export interface Session {
  id: string;
  user_id: string;
  sport: Sport;
  subtrack: string;
  week_number: number;
  day_number: number;
  workout_id: string;
  notes: string | null;
  completed_at: string;
}

export interface SetLog {
  id: string;
  session_id: string;
  exercise_name: string;
  movement_id: string | null;
  set_number: number;
  weight_lbs: number | null;
  reps: number | null;
  rpe_actual: number | null;
  logged_at: string;
}

export interface Movement {
  id: string;
  name: string;
  category: string;
  subcategory: string | null;
  tags: string[];
  youtube_url: string | null;
  youtube_embed_id: string | null;
  cue_points: string[] | null;
  description: string | null;
  difficulty: string | null;
  equipment: string[] | null;
  primary_muscles: string[] | null;
  secondary_muscles: string[] | null;
  is_active: boolean;
}

export interface PersonalRecord {
  id: string;
  user_id: string;
  movement: string;
  weight_lbs: number;
  notes: string | null;
  achieved_at: string;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  subtrack: string;
  user_id: string;
  author_name: string;
  content: string;
  is_coach: boolean;
  is_pinned: boolean;
  created_at: string;
}
