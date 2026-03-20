import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Workout, Session, SetLog } from '@/lib/types';

export function useWorkout(id: string) {
  return useQuery({
    queryKey: ['workouts', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as Workout;
    },
    enabled: !!id,
  });
}

export function useNextWorkout(discipline?: string, subtrack?: string, userId?: string) {
  return useQuery({
    queryKey: ['next-workout', discipline, subtrack, userId],
    queryFn: async () => {
      // Fetch all available workouts for this track, sorted by week then day
      const { data: allWorkouts, error: workoutsError } = await supabase
        .from('workouts')
        .select(
          'id, week_number, day_number, discipline, subtrack, title, coach_note, warmup, main_work, accessory, created_at, is_flex_day, flex_day_type, flex_day_note',
        )
        .eq('discipline', discipline)
        .eq('subtrack', subtrack)
        .or('is_flex_day.eq.false,is_flex_day.is.null')
        .order('week_number', { ascending: true })
        .order('day_number', { ascending: true });

      if (workoutsError) throw workoutsError;
      if (!allWorkouts || allWorkouts.length === 0) return null;

      // Last completed *base* session only — flex completions must not advance the main sequence
      const { data: recentSessions } = await supabase
        .from('sessions')
        .select('week_number, day_number, workout_id, workouts(is_flex_day)')
        .eq('user_id', userId)
        .eq('discipline', discipline)
        .eq('subtrack', subtrack)
        .order('completed_at', { ascending: false })
        .limit(40);

      const lastBase = (recentSessions ?? []).find(s => {
        const w = s.workouts as { is_flex_day?: boolean } | null | undefined;
        return !w?.is_flex_day;
      });

      if (!lastBase) {
        return allWorkouts[0] as Workout;
      }

      const last = lastBase;

      // Find the index of the last completed workout in the available sequence
      const lastCompletedIdx = allWorkouts.findIndex(
        w => w.week_number === last.week_number && w.day_number === last.day_number
      );

      if (lastCompletedIdx === -1) {
        // Last completed workout not found in templates (maybe deleted) — start from beginning
        return allWorkouts[0] as Workout;
      }

      const nextIdx = lastCompletedIdx + 1;

      if (nextIdx < allWorkouts.length) {
        // Advance to next workout in sequence
        return allWorkouts[nextIdx] as Workout;
      }

      // Completed all workouts in the track — cycle back to beginning
      return allWorkouts[0] as Workout;
    },
    enabled: !!discipline && !!subtrack && !!userId,
  });
}

export function useRecentSessions(userId?: string) {
  return useQuery({
    queryKey: ['sessions', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sessions')
        .select('*, workouts(title)')
        .eq('user_id', userId)
        .order('completed_at', { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
}

export function useCompleteWorkout() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ session, sets }: { session: Partial<Session>, sets: Partial<SetLog>[] }) => {
      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .insert([session])
        .select()
        .single();
        
      if (sessionError) throw sessionError;
      
      if (sets.length > 0) {
        const setsToInsert = sets.map(s => ({
          ...s,
          session_id: sessionData.id
        }));
        
        const { error: setsError } = await supabase
          .from('set_logs')
          .insert(setsToInsert);
          
        if (setsError) throw setsError;
      }
      
      return sessionData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['next-workout'] });
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['flex-workout-week'] });
      queryClient.invalidateQueries({ queryKey: ['completed-workout-ids'] });
      queryClient.invalidateQueries({ queryKey: ['track-workouts-all'] });
    },
  });
}

export function useFlexWorkoutForWeek(
  discipline?: string,
  subtrack?: string,
  weekNumber?: number,
  userId?: string,
) {
  return useQuery({
    queryKey: ['flex-workout-week', discipline, subtrack, weekNumber, userId],
    queryFn: async () => {
      const { data: flex, error } = await supabase
        .from('workouts')
        .select('*')
        .eq('discipline', discipline!)
        .eq('subtrack', subtrack!)
        .eq('week_number', weekNumber!)
        .eq('is_flex_day', true)
        .maybeSingle();
      if (error) throw error;
      if (!flex) return null;
      const { data: done } = await supabase
        .from('sessions')
        .select('id')
        .eq('user_id', userId!)
        .eq('workout_id', flex.id)
        .limit(1);
      if (done?.length) return null;
      return flex as Workout;
    },
    enabled: !!discipline && !!subtrack && weekNumber != null && !!userId,
  });
}

export function useTrackCycleWorkouts(discipline?: string, subtrack?: string) {
  return useQuery({
    queryKey: ['track-workouts-all', discipline, subtrack],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .eq('discipline', discipline!)
        .eq('subtrack', subtrack!)
        .order('week_number', { ascending: true })
        .order('day_number', { ascending: true });
      if (error) throw error;
      return (data ?? []) as Workout[];
    },
    enabled: !!discipline && !!subtrack,
  });
}

export function useCompletedWorkoutIds(userId?: string, discipline?: string, subtrack?: string) {
  return useQuery({
    queryKey: ['completed-workout-ids', userId, discipline, subtrack],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sessions')
        .select('workout_id')
        .eq('user_id', userId!)
        .eq('discipline', discipline!)
        .eq('subtrack', subtrack!);
      if (error) throw error;
      return new Set((data ?? []).map(s => s.workout_id).filter(Boolean) as string[]);
    },
    enabled: !!userId && !!discipline && !!subtrack,
  });
}
