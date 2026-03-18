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
        .select('id, week_number, day_number, discipline, subtrack, title, coach_note, warmup, main_work, accessory, created_at')
        .eq('discipline', discipline)
        .eq('subtrack', subtrack)
        .order('week_number', { ascending: true })
        .order('day_number', { ascending: true });

      if (workoutsError) throw workoutsError;
      if (!allWorkouts || allWorkouts.length === 0) return null;

      // Get the most recently completed session for this user in this track
      const { data: lastSessions } = await supabase
        .from('sessions')
        .select('week_number, day_number')
        .eq('user_id', userId)
        .eq('discipline', discipline)
        .eq('subtrack', subtrack)
        .order('week_number', { ascending: false })
        .order('day_number', { ascending: false })
        .limit(1);

      // If no sessions yet, return the first workout in the track
      if (!lastSessions || lastSessions.length === 0) {
        return allWorkouts[0] as Workout;
      }

      const last = lastSessions[0];

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
    },
  });
}
