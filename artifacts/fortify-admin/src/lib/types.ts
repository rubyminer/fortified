export type Discipline = string;

export interface Profile {
  id: string;
  name: string;
  discipline: Discipline;
  subtrack: string;
  level: string;
  frequency: number;
  is_beta: boolean;
  is_admin: boolean;
  created_at: string;
  primary_training_days?: string[] | null;
  supplemental_timing?: string | null;
  supplemental_days?: string[] | null;
  preferred_workout_time?: string | null;
  cycle_start_date?: string | null;
  notify_day_before?: boolean | null;
  notify_hour_before?: boolean | null;
  notification_timezone?: string | null;
}

export interface ScheduledSession {
  id: string;
  user_id: string;
  workout_id: string;
  scheduled_date: string;
  preferred_time: string | null;
  is_flex_day: boolean;
  is_confirmed: boolean;
  completed: boolean;
  completed_session_id: string | null;
  notification_day_before_sent: boolean;
  notification_hour_before_sent: boolean;
  rescheduled_from: string | null;
  created_at: string;
  workouts?: { title: string } | null;
}

export interface Session {
  id: string;
  user_id: string;
  discipline: Discipline;
  subtrack: string;
  week_number: number;
  day_number: number;
  workout_id: string | null;
  notes: string | null;
  completed_at: string;
  profiles?: { name: string } | null;
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
  discipline: Discipline;
  subtrack: string;
  week_number: number;
  day_number: number;
  title: string;
  coach_note: string | null;
  warmup: string[] | null;
  main_work: WorkoutExercise[] | null;
  accessory: WorkoutExercise[] | null;
  created_at: string;
  is_flex_day?: boolean;
  flex_day_type?: string | null;
  flex_day_note?: string | null;
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

export interface FeedLike {
  id: string;
  user_id: string;
  feed_item_id: string;
  created_at: string;
  profiles?: { name: string } | null;
}
