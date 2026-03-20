import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Layout } from '@/components/Layout';
import { Drawer } from '@/components/Drawer';
import { SkeletonTable } from '@/components/Skeleton';
import { useToast } from '@/components/Toast';
import { formatSessionsPerWeekLabel } from '@/lib/frequency-label';

interface DisciplineRow {
  id: string;
  label: string;
}

interface ConfigRow {
  id: string;
  discipline: string;
  subtrack: string;
  display_name: string;
  base_days_per_week: number;
  flex_days_per_week: number;
  total_weeks: number;
  description: string | null;
  who_its_for: string | null;
}

interface FormState {
  id: string;
  discipline: string;
  subtrack: string;
  display_name: string;
  base_days_per_week: number;
  flex_days_per_week: number;
  total_weeks: number;
  description: string;
  who_its_for: string;
}

const DISCIPLINE_COLORS: Record<string, { bg: string; text: string }> = {
  crossfit: { bg: 'rgba(240,90,40,0.15)', text: '#F05A28' },
  hyrox: { bg: 'rgba(59,130,246,0.15)', text: '#3b82f6' },
  athx: { bg: 'rgba(168,85,247,0.15)', text: '#a855f7' },
};
const FALLBACK_COLOR = { bg: 'rgba(100,200,100,0.15)', text: '#64c864' };

function disciplineColor(id: string) {
  return DISCIPLINE_COLORS[id] ?? FALLBACK_COLOR;
}

export function SubtrackConfig() {
  const { showToast } = useToast();
  const [disciplines, setDisciplines] = useState<DisciplineRow[]>([]);
  const [rows, setRows] = useState<ConfigRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [{ data: dData }, { data: cData }] = await Promise.all([
      supabase.from('disciplines').select('id, label').order('sort_order'),
      supabase.from('subtrack_config').select('*').order('discipline').order('subtrack'),
    ]);
    setDisciplines((dData ?? []) as DisciplineRow[]);
    setRows((cData ?? []) as ConfigRow[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  function openEdit(r: ConfigRow) {
    setEditId(r.id);
    setForm({
      id: r.id,
      discipline: r.discipline,
      subtrack: r.subtrack,
      display_name: r.display_name,
      base_days_per_week: r.base_days_per_week,
      flex_days_per_week: r.flex_days_per_week,
      total_weeks: r.total_weeks,
      description: r.description ?? '',
      who_its_for: r.who_its_for ?? '',
    });
    setDrawerOpen(true);
  }

  async function save() {
    if (!form || !editId) return;
    if (!form.display_name.trim()) {
      showToast('Display name is required', 'error');
      return;
    }
    setSaving(true);
    const payload = {
      display_name: form.display_name.trim(),
      base_days_per_week: form.base_days_per_week,
      flex_days_per_week: form.flex_days_per_week,
      total_weeks: form.total_weeks,
      description: form.description.trim() || null,
      who_its_for: form.who_its_for.trim() || null,
    };
    const { error } = await supabase.from('subtrack_config').update(payload).eq('id', editId);
    setSaving(false);
    if (error) {
      showToast(error.message, 'error');
      return;
    }
    showToast('Track structure updated', 'success');
    setDrawerOpen(false);
    setRows(prev =>
      prev.map(r =>
        r.id === editId ? { ...r, ...payload, description: payload.description, who_its_for: payload.who_its_for } : r,
      ),
    );
  }

  const disciplineLabel = (id: string) => disciplines.find(d => d.id === id)?.label ?? id;

  return (
    <Layout section="Track Structure">
      <div className="section-header">
        <div>
          <h1 className="section-title">Track Structure</h1>
          <p style={{ color: '#888', fontSize: 13, marginTop: 4 }}>
            Base/flex frequency and onboarding copy per subtrack. Slugs must match <code>subtracks</code> and{' '}
            <code>workouts</code>.
          </p>
        </div>
      </div>

      <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 16 }}>
            <SkeletonTable cols={6} />
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Discipline</th>
                <th>Subtrack slug</th>
                <th>Display name</th>
                <th>Base</th>
                <th>Flex</th>
                <th>Weeks</th>
                <th>Frequency</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => {
                const c = disciplineColor(r.discipline);
                const freq = formatSessionsPerWeekLabel(r.base_days_per_week, r.flex_days_per_week);
                return (
                  <tr key={r.id} style={{ cursor: 'pointer' }} onClick={() => openEdit(r)}>
                    <td>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: 4,
                          background: c.bg,
                          color: c.text,
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                        }}
                      >
                        {disciplineLabel(r.discipline)}
                      </span>
                    </td>
                    <td style={{ color: '#888', fontSize: 12, fontFamily: 'monospace' }}>{r.subtrack}</td>
                    <td style={{ fontWeight: 500 }}>{r.display_name}</td>
                    <td style={{ color: '#888' }}>{r.base_days_per_week}</td>
                    <td style={{ color: '#888' }}>{r.flex_days_per_week}</td>
                    <td style={{ color: '#888' }}>{r.total_weeks}</td>
                    <td style={{ color: '#aaa', fontSize: 13 }}>{freq}</td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ color: '#555', textAlign: 'center', padding: 32 }}>
                    No rows — run seed or migration <code>006</code> + <code>007</code> and seed{' '}
                    <code>subtrack_config</code>.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <Drawer
        open={drawerOpen}
        title="Edit track structure"
        onClose={() => setDrawerOpen(false)}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setDrawerOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={save} disabled={saving || !form}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </>
        }
      >
        {form && (
          <>
            <div className="form-row">
              <div className="form-group">
                <label>Sport / discipline</label>
                <select value={form.discipline} disabled style={{ opacity: 0.6 }}>
                  {disciplines.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Subtrack slug</label>
                <input value={form.subtrack} readOnly style={{ opacity: 0.6, fontFamily: 'monospace' }} />
              </div>
            </div>
            <div className="form-group">
              <label>Display name</label>
              <input
                value={form.display_name}
                onChange={e => setForm({ ...form, display_name: e.target.value })}
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Base days / week</label>
                <input
                  type="number"
                  min={1}
                  max={4}
                  value={form.base_days_per_week}
                  onChange={e =>
                    setForm({ ...form, base_days_per_week: Math.min(4, Math.max(1, +e.target.value || 1)) })
                  }
                />
              </div>
              <div className="form-group">
                <label>Flex days / week</label>
                <input
                  type="number"
                  min={0}
                  max={2}
                  value={form.flex_days_per_week}
                  onChange={e =>
                    setForm({ ...form, flex_days_per_week: Math.min(2, Math.max(0, +e.target.value || 0)) })
                  }
                />
              </div>
              <div className="form-group">
                <label>Total weeks</label>
                <input
                  type="number"
                  min={4}
                  max={8}
                  value={form.total_weeks}
                  onChange={e =>
                    setForm({ ...form, total_weeks: Math.min(8, Math.max(4, +e.target.value || 4)) })
                  }
                />
              </div>
            </div>
            <p style={{ fontSize: 12, color: '#888', marginBottom: 12 }}>
              Frequency label:{' '}
              <strong style={{ color: '#F05A28' }}>
                {formatSessionsPerWeekLabel(form.base_days_per_week, form.flex_days_per_week)}
              </strong>
            </p>
            <div className="form-group">
              <label>Description</label>
              <textarea
                rows={3}
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Who it&apos;s for</label>
              <textarea
                rows={3}
                value={form.who_its_for}
                onChange={e => setForm({ ...form, who_its_for: e.target.value })}
              />
            </div>
          </>
        )}
      </Drawer>
    </Layout>
  );
}
