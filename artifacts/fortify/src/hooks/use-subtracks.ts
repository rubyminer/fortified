import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { ALL_SUBTRACKS, SportGroup } from '@/lib/subtracks';
import { Sport } from '@/lib/types';

interface DbSubtrack {
  id: string;
  sport: Sport;
  name: string;
  description: string | null;
  sort_order: number;
}

const SPORT_LABELS: Record<Sport, string> = {
  crossfit: 'CrossFit',
  hyrox: 'Hyrox',
  athx: 'ATHX',
};

const SPORT_ORDER: Sport[] = ['crossfit', 'hyrox', 'athx'];

export function useSubtracks() {
  return useQuery<SportGroup[]>({
    queryKey: ['subtracks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subtracks')
        .select('id, sport, name, description, sort_order')
        .eq('is_active', true)
        .order('sport')
        .order('sort_order');

      if (error || !data || data.length === 0) {
        return ALL_SUBTRACKS;
      }

      const byName: Record<string, SportGroup> = {};
      for (const sport of SPORT_ORDER) {
        byName[sport] = { sport, label: SPORT_LABELS[sport], subtracks: [] };
      }

      for (const row of data as DbSubtrack[]) {
        if (byName[row.sport]) {
          byName[row.sport].subtracks.push({
            id: row.id,
            name: row.name,
            desc: row.description ?? '',
          });
        }
      }

      return SPORT_ORDER
        .map(s => byName[s])
        .filter(g => g.subtracks.length > 0);
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function buildSportFromSubtrack(groups: SportGroup[]) {
  const map: Record<string, Sport> = {};
  for (const group of groups) {
    for (const sub of group.subtracks) {
      map[sub.id] = group.sport as Sport;
    }
  }
  return (subtrackId: string): Sport => map[subtrackId] ?? 'crossfit';
}
