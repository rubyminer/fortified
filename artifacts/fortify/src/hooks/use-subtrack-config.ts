import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface SubtrackConfigRow {
  id: string;
  discipline: string;
  subtrack: string;
  display_name: string;
  base_days_per_week: number;
  flex_days_per_week: number;
  total_weeks: number;
  description: string | null;
  who_its_for: string | null;
}

export function useSubtrackConfig(discipline?: string, subtrack?: string) {
  return useQuery({
    queryKey: ['subtrack-config', discipline, subtrack],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subtrack_config')
        .select('*')
        .eq('discipline', discipline!)
        .eq('subtrack', subtrack!)
        .maybeSingle();
      if (error) throw error;
      return data as SubtrackConfigRow | null;
    },
    enabled: !!discipline && !!subtrack,
  });
}

export function useAllSubtrackConfig() {
  return useQuery({
    queryKey: ['subtrack-config-all'],
    queryFn: async () => {
      const { data, error } = await supabase.from('subtrack_config').select('*').order('discipline');
      if (error) throw error;
      return (data ?? []) as SubtrackConfigRow[];
    },
  });
}
