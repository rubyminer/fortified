import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Layout } from '@/components/Layout';
import { Drawer } from '@/components/Drawer';
import { SkeletonTable } from '@/components/Skeleton';
import { useToast } from '@/components/Toast';

interface Sport {
  id: string;
  label: string;
  tagline: string | null;
  cycle_weeks: number;
  days_min: number;
  days_max: number;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

interface FormState {
  id: string;
  label: string;
  tagline: string;
  cycle_weeks: number;
  days_min: number;
  days_max: number;
  sort_order: number;
  is_active: boolean;
}

function defaultForm(): FormState {
  return {
    id: '', label: '', tagline: '',
    cycle_weeks: 4, days_min: 2, days_max: 3,
    sort_order: 0, is_active: true,
  };
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

export function Sports() {
  const { showToast } = useToast();
  const [rows, setRows] = useState<Sport[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(defaultForm());
  const [saving, setSaving] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('sports').select('*').order('sort_order');
    setRows((data ?? []) as Sport[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  function openNew() {
    setEditId(null);
    setForm(defaultForm());
    setDrawerOpen(true);
  }

  function openEdit(s: Sport) {
    setEditId(s.id);
    setForm({
      id: s.id,
      label: s.label,
      tagline: s.tagline ?? '',
      cycle_weeks: s.cycle_weeks,
      days_min: s.days_min,
      days_max: s.days_max,
      sort_order: s.sort_order,
      is_active: s.is_active,
    });
    setDrawerOpen(true);
  }

  async function save() {
    if (!form.id.trim() || !form.label.trim()) {
      showToast('ID and label are required', 'error');
      return;
    }
    setSaving(true);
    const payload = {
      id: form.id,
      label: form.label,
      tagline: form.tagline || null,
      cycle_weeks: form.cycle_weeks,
      days_min: form.days_min,
      days_max: form.days_max,
      sort_order: form.sort_order,
      is_active: form.is_active,
    };
    const { error } = editId
      ? await supabase.from('sports').update(payload).eq('id', editId)
      : await supabase.from('sports').insert(payload);
    setSaving(false);
    if (error) { showToast(error.message, 'error'); return; }
    showToast(editId ? 'Sport updated' : 'Sport created', 'success');
    setDrawerOpen(false);
    fetch();
  }

  async function toggleActive() {
    const { error } = await supabase
      .from('sports')
      .update({ is_active: !form.is_active })
      .eq('id', editId!);
    if (!error) {
      showToast(form.is_active ? 'Sport deactivated' : 'Sport activated', 'info');
      setDrawerOpen(false);
      fetch();
    }
  }

  return (
    <Layout section="Sports">
      <div className="section-header">
        <div>
          <h1 className="section-title">Sports</h1>
          <p style={{ color: '#888', fontSize: 13, marginTop: 4 }}>
            Top-level sport categories. Each sport groups its own subtracks and
            defines the default cycle length shown to athletes.
          </p>
        </div>
        <button className="btn btn-primary" onClick={openNew}>+ New Sport</button>
      </div>

      <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 16 }}><SkeletonTable cols={5} /></div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Label</th>
                <th>ID (slug)</th>
                <th>Tagline</th>
                <th>Cycle</th>
                <th>Days / Week</th>
                <th>Order</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(s => (
                <tr key={s.id} style={{ cursor: 'pointer' }} onClick={() => openEdit(s)}>
                  <td style={{ fontWeight: 600 }}>{s.label}</td>
                  <td style={{ color: '#888', fontSize: 12, fontFamily: 'monospace' }}>{s.id}</td>
                  <td style={{ color: '#888', fontSize: 12 }}>{s.tagline ?? '—'}</td>
                  <td style={{ color: '#888', fontSize: 12 }}>{s.cycle_weeks}w</td>
                  <td style={{ color: '#888', fontSize: 12 }}>{s.days_min}–{s.days_max}x</td>
                  <td style={{ textAlign: 'center', color: '#888' }}>{s.sort_order}</td>
                  <td>
                    <span className={`badge badge-${s.is_active ? 'active' : 'inactive'}`}>
                      {s.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ color: '#555', textAlign: 'center', padding: 32 }}>
                    No sports yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <Drawer
        open={drawerOpen}
        title={editId ? 'Edit Sport' : 'New Sport'}
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
              {saving ? 'Saving…' : editId ? 'Save Changes' : 'Create Sport'}
            </button>
          </>
        }
      >
        <div className="form-row">
          <div className="form-group">
            <label>Label</label>
            <input
              value={form.label}
              onChange={e => {
                const label = e.target.value;
                setForm(f => ({ ...f, label, id: editId ? f.id : slugify(label) }));
              }}
              placeholder="e.g. CrossFit"
            />
          </div>
          <div className="form-group">
            <label>ID (slug)</label>
            <input
              value={form.id}
              onChange={e => setForm({ ...form, id: e.target.value })}
              placeholder="e.g. crossfit"
              readOnly={!!editId}
              style={editId
                ? { opacity: 0.5, cursor: 'not-allowed', fontFamily: 'monospace' }
                : { fontFamily: 'monospace' }}
            />
            <p style={{ fontSize: 11, color: '#666', marginTop: 4 }}>
              Unique identifier used in the database. Auto-generated from label. Cannot be changed after creation.
            </p>
          </div>
        </div>

        <div className="form-group">
          <label>Tagline</label>
          <input
            value={form.tagline}
            onChange={e => setForm({ ...form, tagline: e.target.value })}
            placeholder="e.g. Functional fitness for the broad and well-rounded athlete"
          />
          <p style={{ fontSize: 11, color: '#666', marginTop: 4 }}>
            Short description shown on the athlete profile sport selector.
          </p>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Cycle Length (weeks)</label>
            <input
              type="number"
              min={1}
              value={form.cycle_weeks}
              onChange={e => setForm({ ...form, cycle_weeks: parseInt(e.target.value) || 4 })}
            />
          </div>
          <div className="form-group">
            <label>Min Days / Week</label>
            <input
              type="number"
              min={1}
              value={form.days_min}
              onChange={e => setForm({ ...form, days_min: parseInt(e.target.value) || 2 })}
            />
          </div>
          <div className="form-group">
            <label>Max Days / Week</label>
            <input
              type="number"
              min={1}
              value={form.days_max}
              onChange={e => setForm({ ...form, days_max: parseInt(e.target.value) || 3 })}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Sort Order</label>
            <input
              type="number"
              min={0}
              value={form.sort_order}
              onChange={e => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })}
            />
            <p style={{ fontSize: 11, color: '#666', marginTop: 4 }}>
              Lower numbers appear first in sport lists.
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
              Inactive sports are hidden from athletes.
            </p>
          </div>
        </div>
      </Drawer>
    </Layout>
  );
}
