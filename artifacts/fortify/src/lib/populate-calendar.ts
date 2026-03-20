import type { SupabaseClient } from '@supabase/supabase-js';
import { addDays, addWeeks, format, startOfWeek } from 'date-fns';

/** Monday = 0 … Sunday = 6 */
const DAY_TO_OFFSET: Record<string, number> = {
  monday: 0,
  tuesday: 1,
  wednesday: 2,
  thursday: 3,
  friday: 4,
  saturday: 5,
  sunday: 6,
};

export function normalizeTimeToPg(time: string): string {
  const t = time.trim();
  if (t.length === 5 && t.includes(':')) return `${t}:00`;
  return t;
}

export function defaultSupplementalDays(baseDays: number): string[] {
  const presets: string[][] = [
    ['monday'],
    ['monday', 'thursday'],
    ['monday', 'wednesday', 'friday'],
    ['monday', 'tuesday', 'thursday', 'saturday'],
    ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
  ];
  const idx = Math.min(Math.max(baseDays, 1), 5) - 1;
  return presets[idx] ?? ['monday', 'wednesday', 'friday'];
}

export async function populateCalendar(
  client: SupabaseClient,
  opts: {
    userId: string;
    discipline: string;
    subtrack: string;
    supplementalDays: string[];
    preferredWorkoutTime: string;
    cycleStartDate: Date;
    replaceFutureIncomplete?: boolean;
  },
): Promise<{ inserted: number } | { error: string }> {
  const {
    userId,
    discipline,
    subtrack,
    preferredWorkoutTime,
    cycleStartDate,
    replaceFutureIncomplete = true,
  } = opts;
  let supplementalDays = opts.supplementalDays.map(d => d.toLowerCase());

  const { data: cfg, error: cfgErr } = await client
    .from('subtrack_config')
    .select('base_days_per_week, flex_days_per_week, total_weeks')
    .eq('discipline', discipline)
    .eq('subtrack', subtrack)
    .maybeSingle();

  if (cfgErr) return { error: cfgErr.message };
  if (!cfg) return { error: 'No subtrack_config for this track' };

  if (supplementalDays.length === 0) {
    supplementalDays = defaultSupplementalDays(cfg.base_days_per_week);
  }

  const { data: workoutRows, error: wErr } = await client
    .from('workouts')
    .select('id, week_number, day_number, is_flex_day')
    .eq('discipline', discipline)
    .eq('subtrack', subtrack)
    .order('week_number', { ascending: true })
    .order('is_flex_day', { ascending: true })
    .order('day_number', { ascending: true });

  if (wErr) return { error: wErr.message };
  if (!workoutRows?.length) return { error: 'No workouts for this track' };

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  if (replaceFutureIncomplete) {
    const { error: delErr } = await client
      .from('scheduled_sessions')
      .delete()
      .eq('user_id', userId)
      .eq('completed', false)
      .gte('scheduled_date', todayStr);
    if (delErr) return { error: delErr.message };
  }

  const prefTime = normalizeTimeToPg(preferredWorkoutTime);
  const anchorMonday = startOfWeek(cycleStartDate, { weekStartsOn: 1 });
  const rows: Array<{
    user_id: string;
    workout_id: string;
    scheduled_date: string;
    preferred_time: string;
    is_flex_day: boolean;
    is_confirmed: boolean;
  }> = [];

  for (let weekNum = 1; weekNum <= cfg.total_weeks; weekNum++) {
    const weekStart = addWeeks(anchorMonday, weekNum - 1);
    const seenDates = new Set<string>();
    const dates: Date[] = [];
    for (const dayName of supplementalDays) {
      const off = DAY_TO_OFFSET[dayName];
      if (off === undefined) continue;
      const d = addDays(weekStart, off);
      const ds = format(d, 'yyyy-MM-dd');
      if (seenDates.has(ds)) continue;
      seenDates.add(ds);
      dates.push(d);
    }
    dates.sort((a, b) => a.getTime() - b.getTime());

    const baseList = workoutRows.filter(w => w.week_number === weekNum && !w.is_flex_day);
    const flexList = workoutRows.filter(w => w.week_number === weekNum && w.is_flex_day);

    const nBaseSlots = Math.min(cfg.base_days_per_week, baseList.length, dates.length);
    for (let i = 0; i < nBaseSlots; i++) {
      rows.push({
        user_id: userId,
        workout_id: baseList[i]!.id,
        scheduled_date: format(dates[i]!, 'yyyy-MM-dd'),
        preferred_time: prefTime,
        is_flex_day: false,
        is_confirmed: true,
      });
    }

    const remainingDates = dates.slice(nBaseSlots);
    const nFlexSlots = Math.min(cfg.flex_days_per_week, flexList.length, remainingDates.length);
    for (let i = 0; i < nFlexSlots; i++) {
      rows.push({
        user_id: userId,
        workout_id: flexList[i]!.id,
        scheduled_date: format(remainingDates[i]!, 'yyyy-MM-dd'),
        preferred_time: prefTime,
        is_flex_day: true,
        is_confirmed: false,
      });
    }
  }

  if (rows.length === 0) return { inserted: 0 };

  const { error: insErr } = await client.from('scheduled_sessions').insert(rows);
  if (insErr) return { error: insErr.message };
  return { inserted: rows.length };
}
