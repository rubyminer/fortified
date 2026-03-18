import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Layout } from '@/components/Layout';
import { Drawer } from '@/components/Drawer';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { SkeletonTable } from '@/components/Skeleton';
import { MovementSearch } from '@/components/MovementSearch';
import { useToast } from '@/components/Toast';
import { DISCIPLINE_SUBTRACKS, subtrackLabel, shortDate } from '@/lib/utils';
import type { Workout, WorkoutExercise, Movement } from '@/lib/types';

const DISCIPLINES = ['crossfit', 'hyrox', 'athx'] as const;

function emptyExercise(): WorkoutExercise {
  return { movement_id: '', name: '', sets: 3, reps: '8', rpe_target: 7, rest_seconds: 90, description: '' };
}

function ExerciseBlock({ ex, onChange, onRemove }: {
  ex: WorkoutExercise; onChange: (e: WorkoutExercise) => void; onRemove: () => void;
}) {
  return (
    <div className="exercise-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 12, color: '#888', fontWeight: 500, textTransform: 'uppercase' }}>Exercise</span>
        <button type="button" className="btn btn-ghost btn-sm" style={{ color: '#ef4444' }} onClick={onRemove}>✕ Remove</button>
      </div>
      <div className="form-group">
        <label>Movement</label>
        <MovementSearch
          value={ex.name}
          onSelect={(m: Movement) => onChange({ ...ex, movement_id: m.id, name: m.name, description: m.description ?? '' })}
          placeholder="Search movement…"
        />
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>Sets</label>
          <input type="number" value={ex.sets} onChange={e => onChange({ ...ex, sets: +e.target.value })} min={1} max={20} />
        </div>
        <div className="form-group">
          <label>Reps</label>
          <input value={ex.reps} onChange={e => onChange({ ...ex, reps: e.target.value })} placeholder="8, 8 each leg, 30m…" />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>RPE Target</label>
          <input type="number" value={ex.rpe_target} onChange={e => onChange({ ...ex, rpe_target: +e.target.value })} step={0.5} min={5} max={10} />
        </div>
        <div className="form-group">
          <label>Rest (seconds)</label>
          <input type="number" value={ex.rest_seconds} onChange={e => onChange({ ...ex, rest_seconds: +e.target.value })} step={15} min={0} />
        </div>
      </div>
      <div className="form-group" style={{ marginBottom: 0 }}>
        <label>Description</label>
        <textarea rows={2} value={ex.description} onChange={e => onChange({ ...ex, description: e.target.value })} />
      </div>
    </div>
  );
}

interface FormState {
  discipline: string; subtrack: string; week_number: number; day_number: number;
  title: string; coach_note: string; warmup: string[];
  main_work: WorkoutExercise[]; accessory: WorkoutExercise[];
}

function defaultForm(): FormState {
  return { discipline: 'crossfit', subtrack: 'overhead_shoulder_strength', week_number: 1, day_number: 1, title: '', coach_note: '', warmup: [''], main_work: [emptyExercise()], accessory: [] };
}

export function Workouts() {
  const { showToast } = useToast();
  const [rows, setRows] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [disciplineFilter, setDisciplineFilter] = useState('all');
  const [subtrackFilter, setSubtrackFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [sortCol, setSortCol] = useState<keyof Workout>('week_number');
  const [sortAsc, setSortAsc] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(defaultForm());
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('workouts').select('*').order('week_number').order('day_number');
    setRows((data ?? []) as Workout[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  function openNew() { setEditId(null); setForm(defaultForm()); setDrawerOpen(true); }
  function openEdit(w: Workout) {
    setEditId(w.id);
    setForm({
      discipline: w.discipline, subtrack: w.subtrack, week_number: w.week_number, day_number: w.day_number,
      title: w.title, coach_note: w.coach_note ?? '',
      warmup: (w.warmup ?? []).concat(''),
      main_work: (w.main_work ?? []).length ? (w.main_work ?? []) : [emptyExercise()],
      accessory: w.accessory ?? [],
    });
    setDrawerOpen(true);
  }

  async function save() {
    if (!form.title.trim()) { showToast('Title is required', 'error'); return; }
    setSaving(true);
    const payload = {
      discipline: form.discipline, subtrack: form.subtrack, week_number: form.week_number, day_number: form.day_number,
      title: form.title, coach_note: form.coach_note || null,
      warmup: form.warmup.filter(w => w.trim()),
      main_work: form.main_work,
      accessory: form.accessory.length ? form.accessory : null,
    };
    const { error } = editId
      ? await supabase.from('workouts').update(payload).eq('id', editId)
      : await supabase.from('workouts').insert(payload);
    setSaving(false);
    if (error) { showToast(error.message, 'error'); return; }
    showToast('Workout saved', 'success');
    setDrawerOpen(false);
    fetch();
  }

  async function del() {
    setDeleting(true);
    await supabase.from('workouts').delete().eq('id', editId!);
    setDeleting(false); setConfirmDelete(false); setDrawerOpen(false);
    showToast('Workout deleted', 'info');
    fetch();
  }

  function toggleSort(col: keyof Workout) {
    if (sortCol === col) setSortAsc(a => !a);
    else { setSortCol(col); setSortAsc(true); }
  }

  const subtracks = disciplineFilter !== 'all' ? (DISCIPLINE_SUBTRACKS[disciplineFilter] ?? []) : [];

  const filtered = rows
    .filter(r => disciplineFilter === 'all' || r.discipline === disciplineFilter)
    .filter(r => subtrackFilter === 'all' || r.subtrack === subtrackFilter)
    .filter(r => !search || r.title.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const av = a[sortCol] ?? ''; const bv = b[sortCol] ?? '';
      if (av < bv) return sortAsc ? -1 : 1;
      if (av > bv) return sortAsc ? 1 : -1;
      return 0;
    });

  const formSubtracks = DISCIPLINE_SUBTRACKS[form.discipline] ?? [];

  return (
    <Layout section="Workouts">
      <div className="section-header">
        <h1 className="section-title">Workouts</h1>
        <button className="btn btn-primary" onClick={openNew}>+ New Workout</button>
      </div>
      <div className="filter-bar">
        <select value={disciplineFilter} onChange={e => { setDisciplineFilter(e.target.value); setSubtrackFilter('all'); }} style={{ width: 160 }}>
          <option value="all">All Disciplines</option>
          {DISCIPLINES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        {disciplineFilter !== 'all' && (
          <select value={subtrackFilter} onChange={e => setSubtrackFilter(e.target.value)} style={{ width: 200 }}>
            <option value="all">All Subtracks</option>
            {subtracks.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        )}
        <input placeholder="Search by title…" value={search} onChange={e => setSearch(e.target.value)} style={{ minWidth: 200 }} />
      </div>
      <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, overflow: 'hidden' }}>
        {loading ? <div style={{ padding: 16 }}><SkeletonTable cols={6} /></div> : (
          <table className="data-table">
            <thead><tr>
              {(['discipline','subtrack','week_number','day_number','title','created_at'] as (keyof Workout)[]).map(col => (
                <th key={col} className="sortable" onClick={() => toggleSort(col)}>
                  {col.replace(/_/g,' ')} {sortCol === col ? (sortAsc ? '↑' : '↓') : ''}
                </th>
              ))}
            </tr></thead>
            <tbody>
              {filtered.map(w => (
                <tr key={w.id} style={{ cursor: 'pointer' }} onClick={() => openEdit(w)}>
                  <td><span className={`badge badge-${w.discipline}`}>{w.discipline}</span></td>
                  <td style={{ color: '#888', fontSize: 12 }}>{subtrackLabel(w.subtrack)}</td>
                  <td>W{w.week_number}</td>
                  <td>D{w.day_number}</td>
                  <td style={{ fontWeight: 500 }}>{w.title}</td>
                  <td style={{ color: '#888', fontSize: 12 }}>{shortDate(w.created_at)}</td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={6} style={{ color: '#555', textAlign: 'center', padding: 32 }}>No workouts found</td></tr>}
            </tbody>
          </table>
        )}
      </div>

      <Drawer
        open={drawerOpen}
        title={editId ? 'Edit Workout' : 'New Workout'}
        onClose={() => setDrawerOpen(false)}
        footer={<>
          <button className="btn btn-secondary" onClick={() => setDrawerOpen(false)}>Cancel</button>
          {editId && <button className="btn btn-destructive" onClick={() => setConfirmDelete(true)}>Delete</button>}
          <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save Workout'}</button>
        </>}
      >
        <div className="form-row">
          <div className="form-group">
            <label>Discipline</label>
            <select value={form.discipline} onChange={e => setForm({ ...form, discipline: e.target.value, subtrack: DISCIPLINE_SUBTRACKS[e.target.value]?.[0]?.id ?? '' })}>
              {DISCIPLINES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Subtrack</label>
            <select value={form.subtrack} onChange={e => setForm({ ...form, subtrack: e.target.value })}>
              {formSubtracks.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Week Number</label>
            <input type="number" min={1} max={6} value={form.week_number} onChange={e => setForm({ ...form, week_number: +e.target.value })} />
          </div>
          <div className="form-group">
            <label>Day Number</label>
            <input type="number" min={1} max={4} value={form.day_number} onChange={e => setForm({ ...form, day_number: +e.target.value })} />
          </div>
        </div>
        <div className="form-group">
          <label>Title</label>
          <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Upper Body Strength Day" />
        </div>
        <div className="form-group">
          <label>Coach Note</label>
          <textarea rows={3} value={form.coach_note} onChange={e => setForm({ ...form, coach_note: e.target.value })} placeholder="Tips, context, intent…" />
        </div>

        <div className="section-divider">Warmup</div>
        {form.warmup.map((w, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <input value={w} onChange={e => { const wl = [...form.warmup]; wl[i] = e.target.value; setForm({ ...form, warmup: wl }); }} placeholder={`Warmup item ${i + 1}`} />
            {form.warmup.length > 1 && (
              <button type="button" className="btn btn-ghost btn-icon" onClick={() => setForm({ ...form, warmup: form.warmup.filter((_,j) => j !== i) })} style={{ flexShrink: 0 }}>✕</button>
            )}
          </div>
        ))}
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => setForm({ ...form, warmup: [...form.warmup, ''] })}>+ Add Warmup Item</button>

        <div className="section-divider" style={{ marginTop: 20 }}>Main Work</div>
        {form.main_work.map((ex, i) => (
          <ExerciseBlock key={i} ex={ex}
            onChange={updated => { const mw = [...form.main_work]; mw[i] = updated; setForm({ ...form, main_work: mw }); }}
            onRemove={() => setForm({ ...form, main_work: form.main_work.filter((_,j) => j !== i) })}
          />
        ))}
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => setForm({ ...form, main_work: [...form.main_work, emptyExercise()] })}>+ Add Exercise</button>

        <div className="section-divider" style={{ marginTop: 20 }}>Accessory Work</div>
        {form.accessory.map((ex, i) => (
          <ExerciseBlock key={i} ex={ex}
            onChange={updated => { const ac = [...form.accessory]; ac[i] = updated; setForm({ ...form, accessory: ac }); }}
            onRemove={() => setForm({ ...form, accessory: form.accessory.filter((_,j) => j !== i) })}
          />
        ))}
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => setForm({ ...form, accessory: [...form.accessory, emptyExercise()] })}>+ Add Accessory Exercise</button>
      </Drawer>

      {confirmDelete && (
        <ConfirmDialog
          title="Delete Workout"
          message="This will permanently delete this workout. This action cannot be undone."
          onConfirm={del}
          onCancel={() => setConfirmDelete(false)}
          loading={deleting}
        />
      )}
    </Layout>
  );
}
