import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Layout } from '@/components/Layout';
import { Drawer } from '@/components/Drawer';
import { SkeletonTable } from '@/components/Skeleton';
import { useToast } from '@/components/Toast';
import { SPORT_SUBTRACKS, subtrackLabel, relativeTime, shortDate } from '@/lib/utils';
import type { Profile, Session, PersonalRecord } from '@/lib/types';

const SPORTS = ['crossfit', 'hyrox', 'athx'];

interface UserRow extends Profile {
  session_count?: number;
  last_active?: string | null;
}

export function Users() {
  const { showToast } = useToast();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sportFilter, setSportFilter] = useState('all');
  const [subtrackFilter, setSubtrackFilter] = useState('all');
  const [selected, setSelected] = useState<UserRow | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [prs, setPrs] = useState<PersonalRecord[]>([]);
  const [showAllSessions, setShowAllSessions] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [trackSport, setTrackSport] = useState('');
  const [trackSubtrack, setTrackSubtrack] = useState('');
  const [updatingTrack, setUpdatingTrack] = useState(false);
  const [updatingAdmin, setUpdatingAdmin] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data: profiles } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (!profiles) { setLoading(false); return; }
    const { data: sessionCounts } = await supabase.from('sessions').select('user_id, completed_at');
    const countMap: Record<string, number> = {};
    const lastMap: Record<string, string> = {};
    (sessionCounts ?? []).forEach(s => {
      countMap[s.user_id] = (countMap[s.user_id] ?? 0) + 1;
      if (!lastMap[s.user_id] || s.completed_at > lastMap[s.user_id]) lastMap[s.user_id] = s.completed_at;
    });
    setUsers((profiles as Profile[]).map(p => ({ ...p, session_count: countMap[p.id] ?? 0, last_active: lastMap[p.id] ?? null })));
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  async function openUser(u: UserRow) {
    setSelected(u);
    setTrackSport(u.sport);
    setTrackSubtrack(u.subtrack);
    setShowAllSessions(false);
    setDetailLoading(true);
    const [sessRes, prRes] = await Promise.all([
      supabase.from('sessions').select('*').eq('user_id', u.id).order('completed_at', { ascending: false }),
      supabase.from('personal_records').select('*').eq('user_id', u.id).order('achieved_at', { ascending: false }),
    ]);
    setSessions((sessRes.data ?? []) as Session[]);
    setPrs((prRes.data ?? []) as PersonalRecord[]);
    setDetailLoading(false);
  }

  async function updateTrack() {
    if (!selected) return;
    setUpdatingTrack(true);
    const { error } = await supabase.from('profiles').update({ sport: trackSport, subtrack: trackSubtrack }).eq('id', selected.id);
    setUpdatingTrack(false);
    if (error) { showToast(error.message, 'error'); return; }
    showToast('Track updated', 'success');
    setSelected({ ...selected, sport: trackSport as any, subtrack: trackSubtrack });
    fetch();
  }

  async function toggleAdmin() {
    if (!selected) return;
    setUpdatingAdmin(true);
    const newVal = !selected.is_admin;
    const { error } = await supabase.from('profiles').update({ is_admin: newVal }).eq('id', selected.id);
    setUpdatingAdmin(false);
    if (error) { showToast(error.message, 'error'); return; }
    setSelected({ ...selected, is_admin: newVal });
    showToast(newVal ? 'Admin granted' : 'Admin revoked', 'info');
  }

  const filtered = users
    .filter(u => !search || u.name.toLowerCase().includes(search.toLowerCase()))
    .filter(u => sportFilter === 'all' || u.sport === sportFilter)
    .filter(u => subtrackFilter === 'all' || u.subtrack === subtrackFilter);

  const subtracks = sportFilter !== 'all' ? (SPORT_SUBTRACKS[sportFilter] ?? []) : [];
  const trackSubtracks = SPORT_SUBTRACKS[trackSport] ?? [];

  const displayedSessions = showAllSessions ? sessions : sessions.slice(0, 20);

  return (
    <Layout section="Users">
      <div className="section-header">
        <h1 className="section-title">Users <span style={{ color: '#888', fontSize: 16 }}>({users.length})</span></h1>
      </div>
      <div className="filter-bar">
        <input placeholder="Search by name…" value={search} onChange={e => setSearch(e.target.value)} style={{ minWidth: 220 }} />
        <select value={sportFilter} onChange={e => { setSportFilter(e.target.value); setSubtrackFilter('all'); }} style={{ width: 140 }}>
          <option value="all">All Sports</option>
          {SPORTS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        {sportFilter !== 'all' && (
          <select value={subtrackFilter} onChange={e => setSubtrackFilter(e.target.value)} style={{ width: 200 }}>
            <option value="all">All Subtracks</option>
            {subtracks.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        )}
      </div>
      <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, overflow: 'hidden' }}>
        {loading ? <div style={{ padding: 16 }}><SkeletonTable cols={7} /></div> : (
          <table className="data-table">
            <thead><tr>
              <th>Name</th><th>Sport</th><th>Subtrack</th><th>Level</th><th>Sessions</th><th>Last Active</th><th>Joined</th>
            </tr></thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id} style={{ cursor: 'pointer' }} onClick={() => openUser(u)}>
                  <td style={{ fontWeight: 500 }}>{u.name}{u.is_admin && <span className="badge badge-coach" style={{ marginLeft: 8, fontSize: 10 }}>Admin</span>}{u.is_beta && <span className="badge badge-beta" style={{ marginLeft: 6, fontSize: 10 }}>Beta</span>}</td>
                  <td><span className={`badge badge-${u.sport}`}>{u.sport}</span></td>
                  <td style={{ color: '#888', fontSize: 12 }}>{subtrackLabel(u.subtrack)}</td>
                  <td><span className={`badge badge-${u.level}`}>{u.level}</span></td>
                  <td>{u.session_count ?? 0}</td>
                  <td style={{ color: '#888', fontSize: 12 }}>{u.last_active ? relativeTime(u.last_active) : '—'}</td>
                  <td style={{ color: '#888', fontSize: 12 }}>{shortDate(u.created_at)}</td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={7} style={{ color: '#555', textAlign: 'center', padding: 32 }}>No users found</td></tr>}
            </tbody>
          </table>
        )}
      </div>

      <Drawer open={!!selected} title="User Detail" onClose={() => setSelected(null)}>
        {selected && (
          <>
            <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, padding: 20, marginBottom: 20 }}>
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>{selected.name}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                <span className={`badge badge-${selected.sport}`}>{selected.sport}</span>
                <span className="badge badge-beginner" style={{ background: '#2a2a2a' }}>{subtrackLabel(selected.subtrack)}</span>
                <span className={`badge badge-${selected.level}`}>{selected.level}</span>
                {selected.is_beta && <span className="badge badge-beta">Beta</span>}
                {selected.is_admin && <span className="badge badge-coach">Admin</span>}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13, color: '#888' }}>
                <div>Joined: <span style={{ color: '#f0f0f0' }}>{shortDate(selected.created_at)}</span></div>
                <div>Frequency: <span style={{ color: '#f0f0f0' }}>{selected.frequency}x/week</span></div>
                <div>Sessions: <span style={{ color: '#f0f0f0' }}>{selected.session_count ?? 0}</span></div>
                <div>PRs: <span style={{ color: '#f0f0f0' }}>{prs.length}</span></div>
              </div>
            </div>

            <div className="section-divider">Admin Controls</div>
            <div className="form-row" style={{ marginBottom: 8 }}>
              <div className="form-group">
                <label>Sport</label>
                <select value={trackSport} onChange={e => { setTrackSport(e.target.value); setTrackSubtrack(SPORT_SUBTRACKS[e.target.value]?.[0]?.id ?? ''); }}>
                  {SPORTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Subtrack</label>
                <select value={trackSubtrack} onChange={e => setTrackSubtrack(e.target.value)}>
                  {trackSubtracks.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </div>
            <p style={{ fontSize: 12, color: '#F05A28', marginBottom: 10 }}>This will not reset session history. Their next workout will be from the new track.</p>
            <button className="btn btn-secondary btn-sm" onClick={updateTrack} disabled={updatingTrack}>
              {updatingTrack ? 'Updating…' : 'Update Track'}
            </button>
            <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
              <label className="toggle">
                <input type="checkbox" checked={selected.is_admin} onChange={toggleAdmin} disabled={updatingAdmin} />
                <span className="toggle-track" />
                <span className="toggle-thumb" />
              </label>
              <span style={{ fontSize: 13 }}>Admin access</span>
            </div>

            {detailLoading ? <div style={{ padding: 20, textAlign: 'center', color: '#555' }}>Loading…</div> : <>
              <div className="section-divider" style={{ marginTop: 20 }}>Session History ({sessions.length})</div>
              <table className="data-table">
                <thead><tr><th>Date</th><th>Sport</th><th>Week/Day</th></tr></thead>
                <tbody>
                  {displayedSessions.map(s => (
                    <tr key={s.id}>
                      <td style={{ fontSize: 12, color: '#888' }}>{shortDate(s.completed_at)}</td>
                      <td><span className={`badge badge-${s.sport}`} style={{ fontSize: 10 }}>{s.sport}</span></td>
                      <td style={{ color: '#888', fontSize: 12 }}>W{s.week_number} D{s.day_number}</td>
                    </tr>
                  ))}
                  {sessions.length === 0 && <tr><td colSpan={3} style={{ color: '#555', textAlign: 'center', padding: 16 }}>No sessions</td></tr>}
                </tbody>
              </table>
              {sessions.length > 20 && !showAllSessions && (
                <button className="btn btn-secondary btn-sm" style={{ marginTop: 10 }} onClick={() => setShowAllSessions(true)}>Show all {sessions.length} sessions</button>
              )}

              <div className="section-divider" style={{ marginTop: 20 }}>PR History ({prs.length})</div>
              <table className="data-table">
                <thead><tr><th>Movement</th><th>Weight (lbs)</th><th>Date</th></tr></thead>
                <tbody>
                  {prs.map(pr => (
                    <tr key={pr.id}>
                      <td>{pr.movement}</td>
                      <td style={{ fontWeight: 600, color: '#F05A28' }}>{pr.weight_lbs} lbs</td>
                      <td style={{ fontSize: 12, color: '#888' }}>{shortDate(pr.achieved_at)}</td>
                    </tr>
                  ))}
                  {prs.length === 0 && <tr><td colSpan={3} style={{ color: '#555', textAlign: 'center', padding: 16 }}>No PRs logged</td></tr>}
                </tbody>
              </table>
            </>}
          </>
        )}
      </Drawer>
    </Layout>
  );
}
