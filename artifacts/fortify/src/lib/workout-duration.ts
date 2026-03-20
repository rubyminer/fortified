import type { Workout, WorkoutExercise } from '@/lib/types';

function sumExerciseMinutes(exercises: WorkoutExercise[] | null | undefined): number {
  if (!exercises?.length) return 0;
  let sec = 0;
  for (const ex of exercises) {
    const sets = ex.sets ?? 0;
    const rest = ex.rest_seconds ?? 0;
    sec += sets * (45 + rest);
  }
  return Math.ceil(sec / 60);
}

/** Rough estimate for UI (session cards, notifications). */
export function estimateWorkoutMinutes(workout: Pick<Workout, 'main_work' | 'accessory' | 'warmup'>): number {
  const main = sumExerciseMinutes(workout.main_work ?? undefined);
  const acc = sumExerciseMinutes(workout.accessory ?? undefined);
  const warm = Array.isArray(workout.warmup) ? workout.warmup.length * 3 : 0;
  const total = main + acc + warm;
  return Math.max(total, 20);
}
