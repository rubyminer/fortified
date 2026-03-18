import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Layout } from '@/components/Layout';
import { Drawer } from '@/components/Drawer';
import { SkeletonTable } from '@/components/Skeleton';
import { useToast } from '@/components/Toast';

interface SportRow {
  id: string;
  label: string;
  is_active: boolean;
  sort_order: number;
}

interface Subtrack {
  id: string;
  sport: string;
  name: string;
  description: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

interface FormState {
  id: string;
  sport: string;
  name: string;
  description: string;
  sort_order: number;
  is_active: boolean;
}

const SPORT_COLORS: Record<string, { bg: string; text: string }> = {
  crossfit: { bg: 'rgba(240,90,40,0.15)',   text: '#F05A28' },
  hyrox:    { bg: 'rgba(59,130,246,0.15)',   text: '#3b82f6' },
  athx:     { bg: 'rgba(168,85,247,0.15)',   text: '#a855f7' },
};
const FALLBACK_COLOR = { bg: 'rgba(100,200,100,0.15)', text: '#64c864' };

function sportColor(id: string) {
  return SPORT_COLORS[id] ?? FALLBACK_COLOR;
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

function defaultForm(firstSportId: string): FormState {
  return { id: '', sport: firstSportId, name: '', description: '', sort_order: 0, is_active: true };
}

export function Subtracks() {
  const { showToast } = useToast();
  const [sports, setSports] = useState<SportRow[]>([]);
  const [rows, setRows] = useState<Subtrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [sportFilter, setSportFilter] = useState<string>('all');
  const [activeOnly, setActiveOnly] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(defaultForm('crossfit'));
  const [saving, setSaving] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [{ data: sportsData }, { data: subtracksData }] = await Promise.all([
      supabase.from('sports').select('id, label, is_active, sort_order').order('sort_order'),
      supabase.from('subtracks').select('*').order('sport').order('sort_order'),
    ]);
    const sportList = (sportsData ?? []) as SportRow[];
    setSports(sportList);
    setRows((subtracksData ?? []) as Subtrack[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  function openNew() {
    setEditId(null);
    setForm(defaultForm(sports[0]?.id ?? 'crossfit'));
    setDrawerOpen(true);
  }

  function openEdit(s: Subtrack) {
    setEditId(s.id);
    setForm({
      id: s.id,
      sport: s.sport,
      name: s.name,
      description: s.description ?? '',
      sort_order: s.sort_order,
      is_active: s.is_active,
    });
    setDrawerOpen(true);
  }

  async function save() {
    if (!form.id.trim() || !form.name.trim()) {
      showToast('ID and name are required', 'error');
      return;
    }
    setSaving(true);
    const payload = {
      id: form.id,
      sport: form.sport,
      name: form.name,
      description: form.description || null,
      sort_order: form.sort_order,
      is_active: form.is_active,
    };
    const { error } = editId
      ? await supabase.from('subtracks').update(payload).eq('id', editId)
      : await supabase.from('subtracks').insert(payload);
    setSaving(false);
    if (error) { showToast(error.message, 'error'); return; }
    showToast(editId ? 'Subtrack updated' : 'Subtrack created', 'success');
    setDrawerOpen(false);
    fetchAll();
  }

  async function toggleActive() {
    const { error } = await supabase
      .from('subtracks')
      .update({ is_active: !form.is_active })
      .eq('id', editId!);
    if (!error) {
      showToast(form.is_active ? 'Subtrack deactivated' : 'Subtrack activated', 'info');
      setDrawerOpen(false);
      fetchAll();
    }
  }

  const sportLabel = (id: string) => sports.find(s => s.id === id)?.label ?? id;

  const filtered = rows
    .filter(r => sportFilter === 'all' || r.sport === sportFilter)
    .filter(r => !activeOnly || r.is_active);

  return (
    <Layout section="Subtracks">
      <div className="section-header">
        <div>
          <h1 className="section-title">Subtracks</h1>
          <p style={{ color: '#888', fontSize: 13, marginTop: 4 }}>
            Training focus areas shown during onboarding and in the feed switcher.
          </p>
        </div>
        <button className="btn btn-primary" onClick={openNew}>+ New Subtrack</button>
      </div>

      {/* Stats per sport */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        {sports.map(s => {
          const c = sportColor(s.id);
          return (
            <div key={s.id} style={{
              background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8,
              padding: '12px 20px', minWidth: 120,
            }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: c.text }}>
                {rows.filter(r => r.sport === s.id).length}
              </div>
              <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{s.label}</div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button
            type="button"
            className={`btn btn-sm ${sportFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setSportFilter('all')}
          >
            All Sports
          </button>
          {sports.map(s => (
            <button
              key={s.id}
              type="button"
              className={`btn btn-sm ${sportFilter === s.id ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setSportFilter(s.id)}
            >
              {s.label}
            </button>
          ))}
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', textTransform: 'none', marginBottom: 0, fontSize: 13, color: '#888' }}>
          <input type="checkbox" checked={activeOnly} onChange={e => setActiveOnly(e.target.checked)} style={{ width: 'auto', cursor: 'pointer' }} />
          Active only
        </label>
      </div>

      <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 16 }}><SkeletonTable cols={5} /></div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Sport</th>
                <th>ID (slug)</th>
                <th>Description</th>
                <th style={{ textAlign: 'center' }}>Order</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => {
                const c = sportColor(s.sport);
                return (
                  <tr key={s.id} style={{ cursor: 'pointer' }} onClick={() => openEdit(s)}>
                    <td style={{ fontWeight: 500 }}>{s.name}</td>
                    <td>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
                        background: c.bg, color: c.text,
                        textTransform: 'uppercase', letterSpacing: '0.08em',
                      }}>
                        {sportLabel(s.sport)}
                      </span>
                    </td>
                    <td style={{ color: '#888', fontSize: 12, fontFamily: 'monospace' }}>{s.id}</td>
                    <td style={{ color: '#888', fontSize: 12 }}>{s.description ?? '—'}</td>
                    <td style={{ textAlign: 'center', color: '#888' }}>{s.sort_order}</td>
                    <td>
                      <span className={`badge badge-${s.is_active ? 'active' : 'inactive'}`}>
                        {s.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ color: '#555', textAlign: 'center', padding: 32 }}>
                    No subtracks found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <Drawer
        open={drawerOpen}
        title={editId ? 'Edit Subtrack' : 'New Subtrack'}
        onClose={() => setDrawerOpen(false)}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setDrawerOpen(false)}>Cancel</button>
            {editId && (
              <button className="btn btn-secondary" onClick={toggleActive}>
                {form.is_active ? 'Deactivate' : 'Activate'}
              </button>
            )}
            <button className="btn btn-primary" onClick={save} disabled={saving}>
              {saving ? 'Saving…' : editId ? 'Save Changes' : 'Create Subtrack'}
            </button>
          </>
        }
      >
        <div className="form-row">
          <div className="form-group">
            <label>Name</label>
            <input
              value={form.name}
              onChange={e => {
                const name = e.target.value;
                setForm(f => ({ ...f, name, id: editId ? f.id : slugify(name) }));
              }}
              placeholder="e.g. Overhead & Shoulder"
            />
          </div>
          <div className="form-group">
            <label>Sport</label>
            <select
              value={form.sport}
              onChange={e => setForm({ ...form, sport: e.target.value })}
              disabled={!!editId}
              style={editId ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
            >
              {sports.map(s => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
            <p style={{ fontSize: 11, color: '#666', marginTop: 4 }}>
              Sport cannot be changed after creation.
            </p>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>ID (slug)</label>
            <input
              value={form.id}
              onChange={e => setForm({ ...form, id: e.target.value })}
              placeholder="overhead_shoulder_strength"
              readOnly={!!editId}
              style={editId ? { opacity: 0.5, cursor: 'not-allowed', fontFamily: 'monospace' } : { fontFamily: 'monospace' }}
            />
            <p style={{ fontSize: 11, color: '#666', marginTop: 4 }}>
              Auto-generated from name. Cannot be changed after creation.
            </p>
          </div>
          <div className="form-group">
            <label>Sort Order</label>
            <input
              type="number"
              min={0}
              value={form.sort_order}
              onChange={e => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })}
              placeholder="0"
            />
            <p style={{ fontSize: 11, color: '#666', marginTop: 4 }}>
              Lower numbers appear first within the sport group.
            </p>
          </div>
        </div>

        <div className="form-group">
          <label>Description</label>
          <input
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            placeholder="e.g. Press strength and stability"
          />
          <p style={{ fontSize: 11, color: '#666', marginTop: 4 }}>
            Short tagline shown under the subtrack name on the onboarding screen.
          </p>
        </div>

        <div className="form-group">
          <label>Active</label>
          <label className="toggle" style={{ marginTop: 10 }}>
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={e => setForm({ ...form, is_active: e.target.checked })}
            />
            <span className="toggle-track" />
            <span className="toggle-thumb" />
          </label>
          <p style={{ fontSize: 11, color: '#666', marginTop: 8 }}>
            Inactive subtracks are hidden from the Fortify app.
          </p>
        </div>
      </Drawer>
    </Layout>
  );
}
