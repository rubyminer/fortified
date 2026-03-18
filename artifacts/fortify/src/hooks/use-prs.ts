import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { PersonalRecord } from '@/lib/types';

export function usePRs(userId?: string) {
  return useQuery({
    queryKey: ['prs', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('personal_records')
        .select('*')
        .eq('user_id', userId)
        .order('achieved_at', { ascending: false });
      if (error) throw error;
      return data as PersonalRecord[];
    },
    enabled: !!userId,
  });
}

export function useCreatePR() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (pr: Omit<PersonalRecord, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('personal_records')
        .insert([pr])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prs'] });
    },
  });
}
