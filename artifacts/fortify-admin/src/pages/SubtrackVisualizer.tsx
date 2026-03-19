import { useState, useEffect, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from 'recharts';
import { supabase } from '@/lib/supabase';
import { Layout } from '@/components/Layout';
import { Drawer } from '@/components/Drawer';
import type { Workout, WorkoutExercise } from '@/lib/types';
import { DISCIPLINE_SUBTRACKS, subtrackLabel } from '@/lib/utils';

const DISCIPLINES = Object.keys(DISCIPLINE_SUBTRACKS);

function avgRpe(workout: Workout): number {
  const all = [...(workout.main_work ?? [])];
  if (!all.length) return 0;
  return all.reduce((s, e) => s + (e.rpe_target ?? 0), 0) / all.length;
}

function totalSets(workout: Workout): number {
  return [
    ...(workout.main_work ?? []),
    ...(workout.accessory ?? []),
  ].reduce((s, e) => s + (e.sets ?? 0), 0);
}

function rpeBadge(rpe: number) {
  if (rpe === 0) return { label: '—', color: '#444', text: '#888' };
  if (rpe <= 7.0) return { label: rpe.toFixed(1), color: '#14532d', text: '#4ade80' };
  if (rpe <= 8.0) return { label: rpe.toFixed(1), color: '#78350f', text: '#fbbf24' };
  return { label: rpe.toFixed(1), color: '#7f1d1d', text: '#f87171' };
}

function ExerciseRow({ ex, index }: { ex: WorkoutExercise; index: number }) {
  return (
    <div style={{
      background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8,
      padding: '12px 14px', marginBottom: 8,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 12, color: '#888', fontWeight: 600 }}>#{index + 1}</span>
        <div style={{ display: 'flex', gap: 6 }}>
          {ex.rpe_target > 0 && (
            <span style={{ fontSize: 11, background: '#1c2028', color: '#F05A28', border: '1px solid #F05A2840', borderRadius: 4, padding: '2px 6px', fontWeight: 700 }}>
              RPE {ex.rpe_target}
            </span>
          )}
          {ex.rest_seconds > 0 && (
            <span style={{ fontSize: 11, background: '#1c1c1c', color: '#888', borderRadius: 4, padding: '2px 6px' }}>
              {ex.rest_seconds}s rest
            </span>
          )}
        </div>
      </div>
      <div style={{ fontWeight: 600, fontSize: 14, color: '#f0f0f0', marginBottom: 4 }}>{ex.name}</div>
      <div style={{ fontSize: 13, color: '#aaa', marginBottom: ex.description ? 6 : 0 }}>
        {ex.sets} sets × {ex.reps}
      </div>
      {ex.description && (
        <div style={{ fontSize: 12, color: '#666', lineHeight: 1.5 }}>{ex.description}</div>
      )}
    </div>
  );
}

function WorkoutDrawer({ workout, onClose }: { workout: Workout; onClose: () => void }) {
  const rpe = avgRpe(workout);
  const { label, color, text } = rpeBadge(rpe);

  return (
    <Drawer
      open
      title={workout.title}
      onClose={onClose}
    >
      {/* Meta row */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, background: '#222', borderRadius: 6, padding: '4px 10px', color: '#888' }}>
          Week {workout.week_number} · Day {workout.day_number}
        </span>
        <span style={{ fontSize: 12, background: '#222', borderRadius: 6, padding: '4px 10px', color: '#aaa' }}>
          {subtrackLabel(workout.subtrack)}
        </span>
        {rpe > 0 && (
          <span style={{ fontSize: 12, background: color, borderRadius: 6, padding: '4px 10px', color: text, fontWeight: 700 }}>
            Avg RPE {label}
          </span>
        )}
        <span style={{ fontSize: 12, background: '#222', borderRadius: 6, padding: '4px 10px', color: '#aaa' }}>
          {totalSets(workout)} total sets
        </span>
      </div>

      {/* Coach note */}
      {workout.coach_note && (
        <div style={{
          background: '#F05A2810', border: '1px solid #F05A2830', borderRadius: 8,
          padding: '12px 14px', marginBottom: 20,
        }}>
          <div style={{ fontSize: 11, color: '#F05A28', fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Coach Note
          </div>
          <div style={{ fontSize: 13, color: '#ddd', lineHeight: 1.6 }}>{workout.coach_note}</div>
        </div>
      )}

      {/* Warmup */}
      {workout.warmup && workout.warmup.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, color: '#888', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
            Warmup
          </div>
          <ul style={{ margin: 0, paddingLeft: 18, listStyle: 'disc' }}>
            {workout.warmup.map((item, i) => (
              <li key={i} style={{ fontSize: 13, color: '#aaa', marginBottom: 4, lineHeight: 1.5 }}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Main work */}
      {workout.main_work && workout.main_work.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, color: '#F05A28', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
            Main Work
          </div>
          {workout.main_work.map((ex, i) => (
            <ExerciseRow key={i} ex={ex} index={i} />
          ))}
        </div>
      )}

      {/* Accessory */}
      {workout.accessory && workout.accessory.length > 0 && (
        <div>
          <div style={{ fontSize: 12, color: '#888', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
            Accessory
          </div>
          {workout.accessory.map((ex, i) => (
            <ExerciseRow key={i} ex={ex} index={i} />
          ))}
        </div>
      )}
    </Drawer>
  );
}

function WorkoutCard({ workout, onClick }: { workout: Workout; onClick: () => void }) {
  const rpe = avgRpe(workout);
  const badge = rpeBadge(rpe);
  const movements = (workout.main_work ?? []).slice(0, 3).map(e => e.name);
  const sets = totalSets(workout);

  return (
    <div
      onClick={onClick}
      style={{
        background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8,
        padding: 12, cursor: 'pointer', height: '100%', boxSizing: 'border-box',
        transition: 'border-color 0.15s, background 0.15s',
        display: 'flex', flexDirection: 'column', gap: 8,
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.borderColor = '#F05A28';
        (e.currentTarget as HTMLDivElement).style.background = '#1f1a18';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.borderColor = '#2a2a2a';
        (e.currentTarget as HTMLDivElement).style.background = '#1a1a1a';
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 600, color: '#f0f0f0', lineHeight: 1.3 }}>
        {workout.title}
      </div>
      <div style={{ flex: 1 }}>
        {movements.map((m, i) => (
          <div key={i} style={{ fontSize: 11, color: '#666', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            · {m}
          </div>
        ))}
        {(workout.main_work ?? []).length > 3 && (
          <div style={{ fontSize: 11, color: '#555' }}>+{(workout.main_work?.length ?? 0) - 3} more</div>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {rpe > 0 ? (
          <span style={{
            fontSize: 11, fontWeight: 700, background: badge.color,
            color: badge.text, borderRadius: 4, padding: '2px 6px',
          }}>
            RPE {badge.label}
          </span>
        ) : <span />}
        <span style={{ fontSize: 11, color: '#555' }}>{sets} sets</span>
      </div>
    </div>
  );
}

function EmptyCell() {
  return (
    <div style={{
      border: '1px dashed #222', borderRadius: 8,
      height: '100%', minHeight: 110, display: 'flex',
      alignItems: 'center', justifyContent: 'center',
    }}>
      <span style={{ fontSize: 12, color: '#333' }}>—</span>
    </div>
  );
}

interface DisciplineConfig {
  cycle_weeks: number;
  days_max: number;
}

export function SubtrackVisualizer() {
  const [discipline, setDiscipline] = useState('');
  const [subtrack, setSubtrack] = useState('');
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [disciplineConfig, setDisciplineConfig] = useState<DisciplineConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Workout | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const subtracks = discipline ? (DISCIPLINE_SUBTRACKS[discipline] ?? []) : [];

  useEffect(() => {
    if (discipline) {
      setSubtrack('');
      setDisciplineConfig(null);
      supabase
        .from('disciplines')
        .select('cycle_weeks, days_max')
        .eq('id', discipline)
        .single()
        .then(({ data }) => {
          if (data) setDisciplineConfig(data as DisciplineConfig);
        });
    }
  }, [discipline]);

  useEffect(() => {
    if (!subtrack || !discipline) { setWorkouts([]); setFetchError(null); return; }
    setLoading(true);
    setFetchError(null);
    supabase
      .from('workouts')
      .select('*')
      .eq('discipline', discipline)
      .eq('subtrack', subtrack)
      .order('week_number')
      .order('day_number')
      .then(({ data, error }) => {
        if (error) {
          setFetchError(error.message);
          setWorkouts([]);
        } else {
          setWorkouts((data as Workout[]) ?? []);
        }
        setLoading(false);
      });
  }, [discipline, subtrack]);

  const { grid, maxWeek, maxDay } = useMemo(() => {
    const map: Record<string, Workout> = {};
    for (const w of workouts) {
      map[`${w.week_number}-${w.day_number}`] = w;
    }
    const mw = disciplineConfig?.cycle_weeks ?? Math.max(...workouts.map(w => w.week_number), 0);
    const md = disciplineConfig?.days_max ?? Math.max(...workouts.map(w => w.day_number), 0);
    return { grid: map, maxWeek: mw, maxDay: md };
  }, [workouts, disciplineConfig]);

  const chartData = useMemo(() => {
    return workouts.map(w => ({
      label: `Wk${w.week_number} D${w.day_number}`,
      rpe: parseFloat(avgRpe(w).toFixed(2)),
      sets: totalSets(w),
    }));
  }, [workouts]);

  const weeks = Array.from({ length: maxWeek }, (_, i) => i + 1);
  const days = Array.from({ length: maxDay }, (_, i) => i + 1);

  return (
    <Layout section="Visualizer">
      {/* Controls */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 28, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 11, color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Discipline</label>
          <select
            value={discipline}
            onChange={e => setDiscipline(e.target.value)}
            style={{
              background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 6,
              color: '#f0f0f0', padding: '8px 12px', fontSize: 14, minWidth: 160,
            }}
          >
            <option value="">Select discipline…</option>
            {DISCIPLINES.map(d => (
              <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 11, color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Subtrack</label>
          <select
            value={subtrack}
            onChange={e => setSubtrack(e.target.value)}
            disabled={!discipline}
            style={{
              background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 6,
              color: discipline ? '#f0f0f0' : '#555', padding: '8px 12px', fontSize: 14, minWidth: 220,
              opacity: discipline ? 1 : 0.5, cursor: discipline ? 'pointer' : 'not-allowed',
            }}
          >
            <option value="">Select subtrack…</option>
            {subtracks.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        {disciplineConfig && (
          <div style={{ marginLeft: 'auto', fontSize: 13, color: '#666', alignSelf: 'flex-end', paddingBottom: 2 }}>
            {workouts.length}/{maxWeek * maxDay} sessions filled · {maxWeek}-week cycle · {maxDay} days/wk
          </div>
        )}
      </div>

      {/* Empty state */}
      {!subtrack && (
        <div style={{
          background: '#141414', border: '1px dashed #2a2a2a', borderRadius: 12,
          padding: '60px 40px', textAlign: 'center',
        }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📊</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#888', marginBottom: 6 }}>Select a subtrack to visualize</div>
          <div style={{ fontSize: 13, color: '#555' }}>Choose a discipline and subtrack above to see the full training cycle grid and progression charts.</div>
        </div>
      )}

      {/* Fetch error */}
      {fetchError && (
        <div style={{
          background: '#2a0f0f', border: '1px solid #7f1d1d', borderRadius: 10,
          padding: '16px 20px', color: '#f87171', fontSize: 13, marginBottom: 20,
        }}>
          Failed to load workouts: {fetchError}
        </div>
      )}

      {/* Loading */}
      {subtrack && loading && (
        <div style={{ padding: '60px 0', textAlign: 'center', color: '#555', fontSize: 14 }}>
          Loading workouts…
        </div>
      )}

      {/* No workouts */}
      {subtrack && !loading && workouts.length === 0 && (
        <div style={{
          background: '#141414', border: '1px dashed #2a2a2a', borderRadius: 12,
          padding: '60px 40px', textAlign: 'center',
        }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#888', marginBottom: 6 }}>No workouts yet</div>
          <div style={{ fontSize: 13, color: '#555' }}>Add workouts to this subtrack from the Workouts page to see them here.</div>
        </div>
      )}

      {/* Grid */}
      {!loading && workouts.length > 0 && (
        <>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ borderCollapse: 'separate', borderSpacing: 8, width: '100%', minWidth: maxDay * 200 + 80 }}>
              <thead>
                <tr>
                  <th style={{ width: 64, fontSize: 11, color: '#555', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'left', paddingBottom: 8 }}>Week</th>
                  {days.map(d => (
                    <th key={d} style={{ fontSize: 11, color: '#555', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'center', paddingBottom: 8 }}>
                      Day {d}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {weeks.map(w => (
                  <tr key={w}>
                    <td style={{ verticalAlign: 'middle', paddingRight: 8 }}>
                      <div style={{
                        fontSize: 12, fontWeight: 700, color: '#F05A28',
                        background: '#F05A2810', borderRadius: 6,
                        padding: '4px 8px', textAlign: 'center', whiteSpace: 'nowrap',
                      }}>
                        Wk {w}
                      </div>
                    </td>
                    {days.map(d => {
                      const workout = grid[`${w}-${d}`];
                      return (
                        <td key={d} style={{ verticalAlign: 'top', minWidth: 180, minHeight: 110 }}>
                          {workout
                            ? <WorkoutCard workout={workout} onClick={() => setSelected(workout)} />
                            : <EmptyCell />}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: 16, marginTop: 12, marginBottom: 32, flexWrap: 'wrap' }}>
            {[
              { label: 'RPE ≤ 7.0', bg: '#14532d', text: '#4ade80' },
              { label: 'RPE 7.5–8.0', bg: '#78350f', text: '#fbbf24' },
              { label: 'RPE > 8.0', bg: '#7f1d1d', text: '#f87171' },
            ].map(({ label, bg, text }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: 3, background: bg }} />
                <span style={{ fontSize: 12, color: '#666' }}>{label}</span>
              </div>
            ))}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ display: 'inline-block', width: 16, height: 0, border: '1px dashed #333' }} />
              <span style={{ fontSize: 12, color: '#555' }}>No session</span>
            </div>
          </div>

          {/* Progression Charts */}
          <div style={{
            background: '#141414', border: '1px solid #2a2a2a', borderRadius: 12, padding: '24px 28px',
          }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Progression Over Cycle</div>
            <div style={{ fontSize: 12, color: '#555', marginBottom: 24 }}>
              Session RPE and total volume (sets) across the full training cycle.
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={chartData} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                <XAxis
                  dataKey="label"
                  tick={{ fill: '#666', fontSize: 11 }}
                  axisLine={{ stroke: '#2a2a2a' }}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="rpe"
                  domain={[5, 10]}
                  tick={{ fill: '#666', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  label={{ value: 'RPE', angle: -90, position: 'insideLeft', fill: '#555', fontSize: 11 }}
                />
                <YAxis
                  yAxisId="sets"
                  orientation="right"
                  tick={{ fill: '#666', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  label={{ value: 'Sets', angle: 90, position: 'insideRight', fill: '#555', fontSize: 11 }}
                />
                <Tooltip
                  contentStyle={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: '#aaa', marginBottom: 4 }}
                  itemStyle={{ color: '#ddd' }}
                />
                <Legend
                  wrapperStyle={{ fontSize: 12, color: '#666', paddingTop: 12 }}
                />
                <Line
                  yAxisId="rpe"
                  type="monotone"
                  dataKey="rpe"
                  name="Avg RPE"
                  stroke="#F05A28"
                  strokeWidth={2}
                  dot={{ fill: '#F05A28', r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  yAxisId="sets"
                  type="monotone"
                  dataKey="sets"
                  name="Total Sets"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  strokeDasharray="4 2"
                  dot={{ fill: '#3b82f6', r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {/* Workout detail drawer */}
      {selected && (
        <WorkoutDrawer workout={selected} onClose={() => setSelected(null)} />
      )}
    </Layout>
  );
}
