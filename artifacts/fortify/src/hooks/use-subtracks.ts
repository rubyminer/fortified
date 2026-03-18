import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { ALL_SUBTRACKS, DisciplineGroup } from '@/lib/subtracks';

interface DbSubtrack {
  id: string;
  discipline: string;
  name: string;
  description: string | null;
  sort_order: number;
}

interface DbDiscipline {
  id: string;
  label: string;
  sort_order: number;
}

export function useSubtracks() {
  return useQuery<DisciplineGroup[]>({
    queryKey: ['subtracks'],
    queryFn: async () => {
      const [{ data: disciplinesData }, { data: subtracksData, error: subtracksError }] = await Promise.all([
        supabase.from('disciplines').select('id, label, sort_order').eq('is_active', true).order('sort_order'),
        supabase.from('subtracks').select('id, discipline, name, description, sort_order').eq('is_active', true).order('discipline').order('sort_order'),
      ]);

      if (subtracksError || !subtracksData || subtracksData.length === 0) {
        return ALL_SUBTRACKS;
      }

      const disciplines = (disciplinesData ?? []) as DbDiscipline[];

      const byDiscipline: Record<string, DisciplineGroup> = {};
      for (const disc of disciplines) {
        byDiscipline[disc.id] = { discipline: disc.id, label: disc.label, subtracks: [] };
      }

      for (const row of subtracksData as DbSubtrack[]) {
        if (byDiscipline[row.discipline]) {
          byDiscipline[row.discipline].subtracks.push({
            id: row.id,
            name: row.name,
            desc: row.description ?? '',
          });
        }
      }

      return disciplines
        .map(d => byDiscipline[d.id])
        .filter(g => g && g.subtracks.length > 0);
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function buildDisciplineFromSubtrack(groups: DisciplineGroup[]) {
  const map: Record<string, string> = {};
  for (const group of groups) {
    for (const sub of group.subtracks) {
      map[sub.id] = group.discipline;
    }
  }
  return (subtrackId: string): string => map[subtrackId] ?? 'crossfit';
}
