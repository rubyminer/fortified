import { CheckCircle2 } from 'lucide-react';
import { useSubtrackConfig } from '@/hooks/use-subtrack-config';
import {
  useCompletedWorkoutIds,
  useTrackCycleWorkouts,
} from '@/hooks/use-workouts';
import type { Profile, Workout } from '@/lib/types';
import { formatCycleHeaderLabel } from '@/lib/frequency-label';
import { Badge } from '@/components/ui/badge';

export function FeedCycleSection({ profile }: { profile: Profile }) {
  const { data: config } = useSubtrackConfig(profile.discipline, profile.subtrack);
  const { data: workouts = [], isLoading } = useTrackCycleWorkouts(
    profile.discipline,
    profile.subtrack,
  );
  const { data: doneIds } = useCompletedWorkoutIds(
    profile.id,
    profile.discipline,
    profile.subtrack,
  );

  if (isLoading || workouts.length === 0) return null;

  const byWeek = new Map<number, Workout[]>();
  for (const w of workouts) {
    const list = byWeek.get(w.week_number) ?? [];
    list.push(w);
    byWeek.set(w.week_number, list);
  }
  for (const list of byWeek.values()) {
    list.sort((a, b) => a.day_number - b.day_number);
  }
  const weekNums = [...byWeek.keys()].sort((a, b) => a - b);

  const header =
    config != null
      ? formatCycleHeaderLabel(
          config.base_days_per_week,
          config.flex_days_per_week,
          config.total_weeks,
        )
      : 'Your cycle';

  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="font-display text-xl tracking-wide text-white">This cycle</h3>
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold text-right">
          {header}
        </span>
      </div>
      <div className="space-y-4">
        {weekNums.map(wn => (
          <div key={wn}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-primary/80 mb-2">
              Week {wn}
            </p>
            <ul className="space-y-2">
              {(byWeek.get(wn) ?? []).map(w => {
                const done = doneIds?.has(w.id) ?? false;
                const isFlex = !!w.is_flex_day;
                return (
                  <li
                    key={w.id}
                    className={`rounded-xl border px-3 py-2.5 flex items-start gap-2 ${
                      done
                        ? 'border-green-500/25 bg-green-500/5 opacity-80'
                        : isFlex
                          ? 'border-dashed border-primary/35 bg-primary/[0.03]'
                          : 'border-white/10 bg-card/40'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`text-sm font-medium ${done ? 'text-muted-foreground line-through' : 'text-white'}`}
                        >
                          {w.title}
                        </span>
                        {isFlex && (
                          <Badge
                            variant="outline"
                            className="text-[9px] uppercase tracking-wider border-primary/40 text-primary/80"
                          >
                            Optional
                          </Badge>
                        )}
                        {isFlex && w.flex_day_type && (
                          <Badge variant="secondary" className="text-[9px] capitalize">
                            {w.flex_day_type}
                          </Badge>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Day {w.day_number}
                        {isFlex ? ' · flex' : ' · base'}
                      </p>
                    </div>
                    {done && <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
