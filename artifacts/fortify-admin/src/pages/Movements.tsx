import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Layout } from '@/components/Layout';
import { Drawer } from '@/components/Drawer';
import { SkeletonTable } from '@/components/Skeleton';
import { TagInput } from '@/components/TagInput';
import { useToast } from '@/components/Toast';
import { CATEGORIES, DIFFICULTIES, extractYoutubeId } from '@/lib/utils';
import type { Movement } from '@/lib/types';

const SPORTS = ['crossfit', 'hyrox', 'athx'];

interface FormState {
  id: string; name: string; category: string; subcategory: string; difficulty: string;
  tags: string[]; youtube_url: string; youtube_embed_id: string; description: string;
  cue_points: string[]; equipment: string[]; primary_muscles: string[]; secondary_muscles: string[];
  is_active: boolean;
}

function defaultForm(): FormState {
  return { id: '', name: '', category: 'squat', subcategory: '', difficulty: 'intermediate', tags: [], youtube_url: '', youtube_embed_id: '', description: '', cue_points: [], equipment: [], primary_muscles: [], secondary_muscles: [], is_active: true };
}

export function Movements() {
  const { showToast } = useToast();
  const [rows, setRows] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [catFilter, setCatFilter] = useState('all');
  const [sportFilter, setSportFilter] = useState('all');
  const [activeOnly, setActiveOnly] = useState(true);
  const [search, setSearch] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(defaultForm());
  const [saving, setSaving] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('movements').select('*').order('name');
    setRows((data ?? []) as Movement[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  function openNew() { setEditId(null); setForm(defaultForm()); setDrawerOpen(true); }
  function openEdit(m: Movement) {
    setEditId(m.id);
    setForm({
      id: m.id, name: m.name, category: m.category, subcategory: m.subcategory ?? '',
      difficulty: m.difficulty ?? 'intermediate', tags: m.tags ?? [], youtube_url: m.youtube_url ?? '',
      youtube_embed_id: m.youtube_embed_id ?? '', description: m.description ?? '',
      cue_points: m.cue_points ?? [], equipment: m.equipment ?? [],
      primary_muscles: m.primary_muscles ?? [], secondary_muscles: m.secondary_muscles ?? [],
      is_active: m.is_active,
    });
    setDrawerOpen(true);
  }

  async function save() {
    if (!form.id.trim() || !form.name.trim()) { showToast('ID and name are required', 'error'); return; }
    setSaving(true);
    const payload = {
      id: form.id, name: form.name, category: form.category, subcategory: form.subcategory || null,
      difficulty: form.difficulty, tags: form.tags, youtube_url: form.youtube_url || null,
      youtube_embed_id: form.youtube_embed_id || null, description: form.description || null,
      cue_points: form.cue_points, equipment: form.equipment, primary_muscles: form.primary_muscles,
      secondary_muscles: form.secondary_muscles, is_active: form.is_active,
    };
    const { error } = editId
      ? await supabase.from('movements').update(payload).eq('id', editId)
      : await supabase.from('movements').insert(payload);
    setSaving(false);
    if (error) { showToast(error.message, 'error'); return; }
    showToast('Movement saved', 'success');
    setDrawerOpen(false);
    fetch();
  }

  async function toggleActive() {
    const { error } = await supabase.from('movements').update({ is_active: !form.is_active }).eq('id', editId!);
    if (!error) { showToast(form.is_active ? 'Movement deactivated' : 'Movement activated', 'info'); setDrawerOpen(false); fetch(); }
  }

  const filtered = rows
    .filter(r => catFilter === 'all' || r.category === catFilter)
    .filter(r => sportFilter === 'all' || (r.tags ?? []).includes(sportFilter))
    .filter(r => !activeOnly || r.is_active)
    .filter(r => !search || r.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <Layout section="Movements">
      <div className="section-header">
        <h1 className="section-title">Movements</h1>
        <button className="btn btn-primary" onClick={openNew}>+ New Movement</button>
      </div>
      <div className="filter-bar" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {['all', ...CATEGORIES].map(c => (
            <button key={c} type="button" className={`btn btn-sm ${catFilter === c ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setCatFilter(c)}>
              {c === 'all' ? 'All' : c.replace(/_/g,' ')}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {['all', ...SPORTS].map(s => (
              <button key={s} type="button" className={`btn btn-sm ${sportFilter === s ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setSportFilter(s)}>
                {s === 'all' ? 'All Sports' : s}
              </button>
            ))}
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', textTransform: 'none', marginBottom: 0, fontSize: 13, color: '#888' }}>
            <input type="checkbox" checked={activeOnly} onChange={e => setActiveOnly(e.target.checked)} style={{ width: 'auto', cursor: 'pointer' }} />
            Active only
          </label>
          <input placeholder="Search by name…" value={search} onChange={e => setSearch(e.target.value)} style={{ minWidth: 200 }} />
        </div>
      </div>
      <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, overflow: 'hidden' }}>
        {loading ? <div style={{ padding: 16 }}><SkeletonTable cols={6} /></div> : (
          <table className="data-table">
            <thead><tr>
              <th>Name</th><th>Category</th><th>Difficulty</th><th>Equipment</th><th>Primary Muscles</th><th>Status</th>
            </tr></thead>
            <tbody>
              {filtered.map(m => (
                <tr key={m.id} style={{ cursor: 'pointer' }} onClick={() => openEdit(m)}>
                  <td style={{ fontWeight: 500 }}>{m.name}</td>
                  <td style={{ color: '#888', fontSize: 12 }}>{m.category?.replace(/_/g,' ')}</td>
                  <td><span className={`badge badge-${m.difficulty}`}>{m.difficulty}</span></td>
                  <td style={{ color: '#888', fontSize: 12 }}>{(m.equipment ?? []).join(', ') || '—'}</td>
                  <td style={{ color: '#888', fontSize: 12 }}>{(m.primary_muscles ?? []).slice(0,2).join(', ') || '—'}</td>
                  <td><span className={`badge badge-${m.is_active ? 'active' : 'inactive'}`}>{m.is_active ? 'Active' : 'Inactive'}</span></td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={6} style={{ color: '#555', textAlign: 'center', padding: 32 }}>No movements found</td></tr>}
            </tbody>
          </table>
        )}
      </div>

      <Drawer
        open={drawerOpen}
        title={editId ? 'Edit Movement' : 'New Movement'}
        onClose={() => setDrawerOpen(false)}
        footer={<>
          <button className="btn btn-secondary" onClick={() => setDrawerOpen(false)}>Cancel</button>
          {editId && <button className="btn btn-secondary" onClick={toggleActive}>{form.is_active ? 'Deactivate' : 'Activate'}</button>}
          <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save Movement'}</button>
        </>}
      >
        <div className="form-row">
          <div className="form-group">
            <label>ID (slug)</label>
            <input value={form.id} onChange={e => setForm({ ...form, id: e.target.value })} placeholder="bulgarian_split_squat" readOnly={!!editId} style={editId ? { opacity: 0.5, cursor: 'not-allowed' } : {}} />
          </div>
          <div className="form-group">
            <label>Name</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Bulgarian Split Squat" />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Category</label>
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c.replace(/_/g,' ')}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Subcategory</label>
            <input value={form.subcategory} onChange={e => setForm({ ...form, subcategory: e.target.value })} placeholder="Optional" />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Difficulty</label>
            <select value={form.difficulty} onChange={e => setForm({ ...form, difficulty: e.target.value })}>
              {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Active</label>
            <label className="toggle" style={{ marginTop: 10 }}>
              <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} />
              <span className="toggle-track" />
              <span className="toggle-thumb" />
            </label>
          </div>
        </div>
        <div className="form-group">
          <label>Tags (sport/context)</label>
          <TagInput values={form.tags} onChange={v => setForm({ ...form, tags: v })} placeholder="crossfit, hyrox…" />
        </div>
        <div className="form-group">
          <label>YouTube URL</label>
          <input
            value={form.youtube_url}
            onChange={e => {
              const url = e.target.value;
              const id = extractYoutubeId(url);
              setForm({ ...form, youtube_url: url, youtube_embed_id: id || form.youtube_embed_id });
            }}
            placeholder="https://youtube.com/watch?v=…"
          />
        </div>
        <div className="form-group">
          <label>YouTube Embed ID</label>
          <input value={form.youtube_embed_id} onChange={e => setForm({ ...form, youtube_embed_id: e.target.value })} placeholder="dQw4w9WgXcQ" />
          {form.youtube_embed_id && (
            <div style={{ marginTop: 8 }}>
              <iframe
                width={320} height={180}
                src={`https://www.youtube.com/embed/${form.youtube_embed_id}`}
                style={{ border: 'none', borderRadius: 6 }}
                allowFullScreen
              />
            </div>
          )}
        </div>
        <div className="form-group">
          <label>Description</label>
          <textarea rows={4} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Coaching cues, execution tips…" />
        </div>
        <div className="form-group">
          <label>Cue Points</label>
          <TagInput values={form.cue_points} onChange={v => setForm({ ...form, cue_points: v })} placeholder="Brace core, neutral spine…" />
        </div>
        <div className="form-group">
          <label>Equipment</label>
          <TagInput values={form.equipment} onChange={v => setForm({ ...form, equipment: v })} placeholder="barbell, dumbbells…" />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Primary Muscles</label>
            <TagInput values={form.primary_muscles} onChange={v => setForm({ ...form, primary_muscles: v })} placeholder="quads, glutes…" />
          </div>
          <div className="form-group">
            <label>Secondary Muscles</label>
            <TagInput values={form.secondary_muscles} onChange={v => setForm({ ...form, secondary_muscles: v })} placeholder="hamstrings, core…" />
          </div>
        </div>
      </Drawer>
    </Layout>
  );
}
