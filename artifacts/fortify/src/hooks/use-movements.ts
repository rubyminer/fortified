import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Movement } from '@/lib/types';

export function useMovements() {
  return useQuery({
    queryKey: ['movements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('movements')
        .select('*')
        .order('name');
      if (error) throw error;
      return data as Movement[];
    },
  });
}

export function useMovement(id: string) {
  return useQuery({
    queryKey: ['movements', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('movements')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as Movement;
    },
    enabled: !!id,
  });
}
