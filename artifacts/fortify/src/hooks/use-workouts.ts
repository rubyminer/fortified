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

export function useNextWorkout(sport?: string, subtrack?: string) {
  return useQuery({
    queryKey: ['next-workout', sport, subtrack],
    queryFn: async () => {
      // Get highest completed session for this track to determine next workout
      const { data: sessions } = await supabase
        .from('sessions')
        .select('week_number, day_number')
        .eq('sport', sport)
        .eq('subtrack', subtrack)
        .order('week_number', { ascending: false })
        .order('day_number', { ascending: false })
        .limit(1);

      let targetWeek = 1;
      let targetDay = 1;

      if (sessions && sessions.length > 0) {
        const last = sessions[0];
        // Simplified progression: assumes 4 days per week maximum
        if (last.day_number >= 4) {
          targetWeek = last.week_number + 1;
          targetDay = 1;
        } else {
          targetWeek = last.week_number;
          targetDay = last.day_number + 1;
        }
      }

      const { data: workout, error } = await supabase
        .from('workouts')
        .select('*')
        .eq('sport', sport)
        .eq('subtrack', subtrack)
        .eq('week_number', targetWeek)
        .eq('day_number', targetDay)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      // Fallback to W1D1 if we ran out of programming
      if (!workout) {
        const { data: fallback } = await supabase
          .from('workouts')
          .select('*')
          .eq('sport', sport)
          .eq('subtrack', subtrack)
          .eq('week_number', 1)
          .eq('day_number', 1)
          .single();
        return fallback as Workout;
      }

      return workout as Workout;
    },
    enabled: !!sport && !!subtrack,
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
