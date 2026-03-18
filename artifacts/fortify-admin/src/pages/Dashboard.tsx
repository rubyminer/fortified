import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Layout } from '@/components/Layout';
import { SkeletonCard, SkeletonTable } from '@/components/Skeleton';
import { relativeTime } from '@/lib/utils';
import type { Session, Profile } from '@/lib/types';

interface Stats { users: number; sessions: number; recent: number; prs: number; }

export function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentSessions, setRecentSessions] = useState<(Session & { profiles: { name: string } | null })[]>([]);
  const [recentUsers, setRecentUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    const [usersRes, sessionsRes, recentRes, prsRes, recentSessionsRes, recentUsersRes] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('sessions').select('id', { count: 'exact', head: true }),
      supabase.from('sessions').select('id', { count: 'exact', head: true }).gte('completed_at', new Date(Date.now() - 7 * 86400000).toISOString()),
      supabase.from('personal_records').select('id', { count: 'exact', head: true }),
      supabase.from('sessions').select('id, user_id, discipline, subtrack, week_number, day_number, completed_at, profiles(name)').order('completed_at', { ascending: false }).limit(10),
      supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(10),
    ]);
    setStats({
      users: usersRes.count ?? 0,
      sessions: sessionsRes.count ?? 0,
      recent: recentRes.count ?? 0,
      prs: prsRes.count ?? 0,
    });
    setRecentSessions((recentSessionsRes.data ?? []) as any);
    setRecentUsers((recentUsersRes.data ?? []) as Profile[]);
    setLoading(false);
  }

  return (
    <Layout section="Dashboard">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 28 }}>
        {loading ? [0,1,2,3].map(i => <SkeletonCard key={i} />) : [
          { label: 'Total Users', value: stats?.users },
          { label: 'Sessions Completed', value: stats?.sessions },
          { label: 'Sessions (7 days)', value: stats?.recent },
          { label: 'PRs Logged', value: stats?.prs },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-label">{s.label}</div>
            <div className="stat-value">{s.value?.toLocaleString() ?? '—'}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8 }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #2a2a2a', fontWeight: 600 }}>Recent Sessions</div>
          {loading ? <div style={{ padding: 16 }}><SkeletonTable rows={5} cols={4} /></div> : (
            <table className="data-table">
              <thead><tr>
                <th>Athlete</th><th>Discipline · Subtrack</th><th>Week / Day</th><th>Completed</th>
              </tr></thead>
              <tbody>{recentSessions.map(s => (
                <tr key={s.id}>
                  <td>{s.profiles?.name ?? '—'}</td>
                  <td><span className={`badge badge-${s.discipline}`}>{s.discipline}</span> <span style={{ color: '#888', fontSize: 12 }}>{s.subtrack?.replace(/_/g,' ')}</span></td>
                  <td style={{ color: '#888' }}>W{s.week_number} D{s.day_number}</td>
                  <td style={{ color: '#888', fontSize: 12 }}>{relativeTime(s.completed_at)}</td>
                </tr>
              ))}
              {recentSessions.length === 0 && <tr><td colSpan={4} style={{ color: '#555', textAlign: 'center', padding: 24 }}>No sessions yet</td></tr>}
              </tbody>
            </table>
          )}
        </div>
        <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8 }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #2a2a2a', fontWeight: 600 }}>Recent Sign-Ups</div>
          {loading ? <div style={{ padding: 16 }}><SkeletonTable rows={5} cols={4} /></div> : (
            <table className="data-table">
              <thead><tr>
                <th>Name</th><th>Discipline</th><th>Level</th><th>Joined</th>
              </tr></thead>
              <tbody>{recentUsers.map(u => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td><span className={`badge badge-${u.discipline}`}>{u.discipline}</span></td>
                  <td><span className={`badge badge-${u.level}`}>{u.level}</span></td>
                  <td style={{ color: '#888', fontSize: 12 }}>{relativeTime(u.created_at)}</td>
                </tr>
              ))}
              {recentUsers.length === 0 && <tr><td colSpan={4} style={{ color: '#555', textAlign: 'center', padding: 24 }}>No users yet</td></tr>}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </Layout>
  );
}
