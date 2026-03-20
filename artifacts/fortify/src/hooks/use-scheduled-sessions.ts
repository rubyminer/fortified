import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabase';
import type { ScheduledSession, Workout } from '@/lib/types';

export type ScheduledSessionWithWorkout = ScheduledSession & { workouts: Workout | null };

const selectWithWorkout =
  '*, workouts(id, discipline, subtrack, week_number, day_number, title, coach_note, warmup, main_work, accessory, created_at, is_flex_day, flex_day_type, flex_day_note)';

export function localTodayStr(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function useHasActiveCalendar(profile: { cycle_start_date?: string | null } | null | undefined) {
  return !!profile?.cycle_start_date;
}

export function useScheduledSessionsInRange(
  userId: string | undefined,
  fromDate: string | undefined,
  toDate: string | undefined,
) {
  return useQuery({
    queryKey: ['scheduled-sessions-range', userId, fromDate, toDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scheduled_sessions')
        .select(selectWithWorkout)
        .eq('user_id', userId!)
        .gte('scheduled_date', fromDate!)
        .lte('scheduled_date', toDate!)
        .order('scheduled_date', { ascending: true });
      if (error) throw error;
      return (data ?? []) as ScheduledSessionWithWorkout[];
    },
    enabled: !!userId && !!fromDate && !!toDate,
  });
}

export function useTodayBaseScheduled(
  userId: string | undefined,
  discipline: string | undefined,
  subtrack: string | undefined,
  enabled: boolean,
) {
  const today = localTodayStr();
  return useQuery({
    queryKey: ['scheduled-today-base', userId, today, discipline, subtrack],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scheduled_sessions')
        .select(selectWithWorkout)
        .eq('user_id', userId!)
        .eq('scheduled_date', today)
        .eq('is_flex_day', false)
        .eq('is_confirmed', true)
        .order('created_at', { ascending: true })
        .limit(1);
      if (error) throw error;
      const row = data?.[0] as ScheduledSessionWithWorkout | undefined;
      if (!row?.workouts) return null;
      if (row.workouts.discipline !== discipline || row.workouts.subtrack !== subtrack) return null;
      return row;
    },
    enabled: !!userId && !!discipline && !!subtrack && enabled,
  });
}

export function useTodayFlexScheduled(
  userId: string | undefined,
  discipline: string | undefined,
  subtrack: string | undefined,
  enabled: boolean,
) {
  const today = localTodayStr();
  return useQuery({
    queryKey: ['scheduled-today-flex', userId, today, discipline, subtrack],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scheduled_sessions')
        .select(selectWithWorkout)
        .eq('user_id', userId!)
        .eq('scheduled_date', today)
        .eq('is_flex_day', true)
        .eq('is_confirmed', true)
        .eq('completed', false)
        .maybeSingle();
      if (error) throw error;
      const row = data as ScheduledSessionWithWorkout | null;
      if (!row?.workouts) return null;
      if (row.workouts.discipline !== discipline || row.workouts.subtrack !== subtrack) return null;
      return row;
    },
    enabled: !!userId && !!discipline && !!subtrack && enabled,
  });
}

export function useUpcomingScheduledSessions(userId: string | undefined, limit = 5) {
  const today = localTodayStr();
  return useQuery({
    queryKey: ['scheduled-upcoming', userId, today, limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scheduled_sessions')
        .select(selectWithWorkout)
        .eq('user_id', userId!)
        .gte('scheduled_date', today)
        .eq('completed', false)
        .order('scheduled_date', { ascending: true })
        .order('created_at', { ascending: true })
        .limit(40);
      if (error) throw error;
      const rows = (data ?? []) as ScheduledSessionWithWorkout[];
      const filtered = rows.filter(r => !r.is_flex_day || r.is_confirmed);
      return filtered.slice(0, limit);
    },
    enabled: !!userId,
  });
}

export function useProgramSummary(userId: string | undefined, discipline: string | undefined, subtrack: string | undefined) {
  return useQuery({
    queryKey: ['program-summary', userId, discipline, subtrack],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scheduled_sessions')
        .select('id, completed, is_flex_day, is_confirmed')
        .eq('user_id', userId!);
      if (error) throw error;
      const rows = data ?? [];
      const planned = rows.length;
      const completed = rows.filter(r => r.completed).length;
      return { planned, completed };
    },
    enabled: !!userId && !!discipline && !!subtrack,
  });
}

export function useUpdateScheduledSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      id: string;
      scheduled_date?: string;
      rescheduled_from?: string | null;
      is_confirmed?: boolean;
    }) => {
      const { id, ...rest } = payload;
      const { data, error } = await supabase
        .from('scheduled_sessions')
        .update(rest)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['scheduled-sessions-range'] });
      qc.invalidateQueries({ queryKey: ['scheduled-today-base'] });
      qc.invalidateQueries({ queryKey: ['scheduled-today-flex'] });
      qc.invalidateQueries({ queryKey: ['scheduled-upcoming'] });
      qc.invalidateQueries({ queryKey: ['program-summary'] });
      qc.invalidateQueries({ queryKey: ['next-workout'] });
    },
  });
}
