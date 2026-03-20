import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Layout } from '@/components/Layout';
import { SkeletonCard, Skeleton } from '@/components/Skeleton';
import {
  format,
  subDays,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  subWeeks,
  parseISO,
  isWithinInterval,
} from 'date-fns';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';

interface Stats { users: number; sessions: number; recent: number; prs: number; prevRecent: number; prevUsers: number; }

const DISCIPLINE_COLORS: Record<string, string> = {
  crossfit: '#1d4ed8',
  hyrox: '#166534',
  athx: '#92400e',
  lower_body_strength: '#2563eb',
  overhead_shoulder_strength: '#1d4ed8',
  pulling_strength: '#3b82f6',
  muscular_endurance: '#60a5fa',
  sled_carry_strength: '#166534',
  running_economy_strength: '#15803d',
  station_specific_strength: '#16a34a',
  strength_endurance: '#22c55e',
  explosive_power: '#92400e',
  posterior_chain_hinge: '#b45309',
  upper_body_power: '#d97706',
  competition_prep: '#f59e0b',
};

function pct(a: number, b: number) {
  if (b === 0) return a > 0 ? '+∞%' : '0%';
  const d = ((a - b) / b) * 100;
  return (d >= 0 ? '+' : '') + d.toFixed(0) + '%';
}

export function Analytics() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [sessionsPerDay, setSessionsPerDay] = useState<{ date: string; count: number }[]>([]);
  const [bySubtrack, setBySubtrack] = useState<{ subtrack: string; count: number; discipline: string }[]>([]);
  const [userGrowth, setUserGrowth] = useState<{ date: string; total: number }[]>([]);
  const [prDist, setPrDist] = useState<{ movement: string; count: number }[]>([]);
  const [adherenceWeeks, setAdherenceWeeks] = useState<{ week: string; pct: number }[]>([]);
  const [flexAdoption, setFlexAdoption] = useState<{ subtrack: string; pct: number }[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const now = new Date();
    const d7 = subDays(now, 7).toISOString();
    const d14 = subDays(now, 14).toISOString();
    const d30 = subDays(now, 30).toISOString();
    const d90 = subDays(now, 90).toISOString();

    const [
      usersRes,
      sessionsRes,
      recentRes,
      prevRes,
      prsRes,
      allSessionsRes,
      allUsersRes,
      prAllRes,
      schedRes,
      flexSchedRes,
    ] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('sessions').select('id', { count: 'exact', head: true }),
      supabase.from('sessions').select('id', { count: 'exact', head: true }).gte('completed_at', d7),
      supabase.from('sessions').select('id', { count: 'exact', head: true }).gte('completed_at', d14).lt('completed_at', d7),
      supabase.from('personal_records').select('id', { count: 'exact', head: true }),
      supabase.from('sessions').select('completed_at, subtrack, discipline').gte('completed_at', d30),
      supabase.from('profiles').select('created_at').gte('created_at', d90).order('created_at'),
      supabase.from('personal_records').select('movement'),
      supabase
        .from('scheduled_sessions')
        .select('scheduled_date, completed, is_flex_day, user_id')
        .gte('scheduled_date', format(subWeeks(now, 10), 'yyyy-MM-dd')),
      supabase
        .from('scheduled_sessions')
        .select('is_flex_day, is_confirmed, workouts(subtrack)')
        .eq('is_flex_day', true),
    ]);

    setStats({
      users: usersRes.count ?? 0, sessions: sessionsRes.count ?? 0,
      recent: recentRes.count ?? 0, prs: prsRes.count ?? 0,
      prevRecent: prevRes.count ?? 0, prevUsers: 0,
    });

    // Sessions per day
    const days = eachDayOfInterval({ start: subDays(now, 29), end: now });
    const dayMap: Record<string, number> = {};
    days.forEach(d => { dayMap[format(d, 'MM/dd')] = 0; });
    (allSessionsRes.data ?? []).forEach(s => {
      const k = format(new Date(s.completed_at), 'MM/dd');
      if (k in dayMap) dayMap[k]++;
    });
    setSessionsPerDay(Object.entries(dayMap).map(([date, count]) => ({ date, count })));

    // By subtrack
    const stMap: Record<string, { count: number; discipline: string }> = {};
    (allSessionsRes.data ?? []).forEach(s => {
      if (!stMap[s.subtrack]) stMap[s.subtrack] = { count: 0, discipline: s.discipline };
      stMap[s.subtrack].count++;
    });
    setBySubtrack(Object.entries(stMap).map(([subtrack, v]) => ({ subtrack: subtrack.replace(/_/g,' '), count: v.count, discipline: v.discipline })).sort((a,b) => b.count - a.count));

    // User growth
    let cum = 0;
    const growthDays = eachDayOfInterval({ start: subDays(now, 89), end: now });
    const userDayMap: Record<string, number> = {};
    growthDays.forEach(d => { userDayMap[format(d, 'MM/dd')] = 0; });
    (allUsersRes.data ?? []).forEach(u => {
      const k = format(new Date(u.created_at), 'MM/dd');
      if (k in userDayMap) userDayMap[k]++;
    });
    setUserGrowth(Object.entries(userDayMap).map(([date, count]) => { cum += count; return { date, total: cum }; }));

    // PR distribution
    const prMap: Record<string, number> = {};
    (prAllRes.data ?? []).forEach(pr => { prMap[pr.movement] = (prMap[pr.movement] ?? 0) + 1; });
    setPrDist(Object.entries(prMap).map(([movement, count]) => ({ movement, count })).sort((a,b) => b.count - a.count).slice(0, 10));

    const schedRows = schedRes.data ?? [];
    const adherence: { week: string; pct: number }[] = [];
    for (let i = 7; i >= 0; i--) {
      const ws = startOfWeek(subWeeks(now, i), { weekStartsOn: 1 });
      const we = endOfWeek(ws, { weekStartsOn: 1 });
      const baseSched = schedRows.filter(s => {
        if (s.is_flex_day) return false;
        const d = parseISO(s.scheduled_date);
        return isWithinInterval(d, { start: ws, end: we });
      });
      const baseDone = baseSched.filter(s => s.completed).length;
      const pct = baseSched.length ? Math.round((baseDone / baseSched.length) * 100) : 0;
      adherence.push({ week: format(ws, 'MM/dd'), pct });
    }
    setAdherenceWeeks(adherence);

    const flexMap: Record<string, { off: number; conf: number }> = {};
    for (const r of flexSchedRes.data ?? []) {
      const w = r.workouts as { subtrack: string } | { subtrack: string }[] | null | undefined;
      const st = (Array.isArray(w) ? w[0]?.subtrack : w?.subtrack) ?? 'unknown';
      if (!flexMap[st]) flexMap[st] = { off: 0, conf: 0 };
      flexMap[st].off += 1;
      if (r.is_confirmed) flexMap[st].conf += 1;
    }
    setFlexAdoption(
      Object.entries(flexMap)
        .map(([subtrack, v]) => ({
          subtrack: subtrack.replace(/_/g, ' '),
          pct: v.off ? Math.round((v.conf / v.off) * 100) : 0,
        }))
        .sort((a, b) => b.pct - a.pct),
    );

    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const tooltipStyle = { background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 6, color: '#f0f0f0', fontSize: 12 };

  return (
    <Layout section="Analytics">
      <div className="section-header">
        <h1 className="section-title">Analytics</h1>
        <button className="btn btn-secondary" onClick={fetchAll} disabled={loading}>↻ Refresh</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 28 }}>
        {loading ? [0,1,2,3].map(i => <SkeletonCard key={i} />) : [
          { label: 'Total Users', value: stats?.users, change: null },
          { label: 'Sessions Completed', value: stats?.sessions, change: null },
          { label: 'Sessions (7 days)', value: stats?.recent, change: pct(stats?.recent ?? 0, stats?.prevRecent ?? 0) },
          { label: 'PRs Logged', value: stats?.prs, change: null },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-label">{s.label}</div>
            <div className="stat-value">{s.value?.toLocaleString() ?? '—'}</div>
            {s.change && <div className="stat-change" style={{ color: s.change.startsWith('+') ? '#22c55e' : '#ef4444' }}>
              {s.change.startsWith('+') ? '↑' : '↓'} {s.change} vs prior 7d
            </div>}
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, padding: 20 }}>
          <div style={{ fontWeight: 600, marginBottom: 16 }}>Sessions per Day (30d)</div>
          {loading ? <Skeleton height={200} /> : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={sessionsPerDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                <XAxis dataKey="date" stroke="#555" tick={{ fontSize: 11 }} interval={4} />
                <YAxis stroke="#555" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="count" stroke="#F05A28" fill="rgba(240,90,40,0.15)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
        <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, padding: 20 }}>
          <div style={{ fontWeight: 600, marginBottom: 16 }}>User Growth (90d)</div>
          {loading ? <Skeleton height={200} /> : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={userGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                <XAxis dataKey="date" stroke="#555" tick={{ fontSize: 11 }} interval={8} />
                <YAxis stroke="#555" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="total" stroke="#F05A28" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, padding: 20 }}>
          <div style={{ fontWeight: 600, marginBottom: 16 }}>Schedule adherence (base sessions, 8 wk)</div>
          {loading ? <Skeleton height={200} /> : adherenceWeeks.length === 0 ? (
            <div style={{ color: '#555', textAlign: 'center', padding: 40 }}>No schedule data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={adherenceWeeks}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                <XAxis dataKey="week" stroke="#555" tick={{ fontSize: 10 }} />
                <YAxis stroke="#555" tick={{ fontSize: 11 }} domain={[0, 100]} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v}%`, 'Completed']} />
                <Line type="monotone" dataKey="pct" stroke="#22c55e" strokeWidth={2} dot />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
        <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, padding: 20 }}>
          <div style={{ fontWeight: 600, marginBottom: 16 }}>Flex day adoption by subtrack</div>
          {loading ? <Skeleton height={200} /> : flexAdoption.length === 0 ? (
            <div style={{ color: '#555', textAlign: 'center', padding: 40 }}>No flex sessions yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={flexAdoption} layout="vertical" margin={{ left: 8, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                <XAxis type="number" stroke="#555" tick={{ fontSize: 11 }} domain={[0, 100]} />
                <YAxis dataKey="subtrack" type="category" stroke="#555" tick={{ fontSize: 9 }} width={130} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v}%`, 'Confirmed']} />
                <Bar dataKey="pct" fill="#F05A28" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, padding: 20 }}>
          <div style={{ fontWeight: 600, marginBottom: 16 }}>Sessions by Subtrack (30d)</div>
          {loading ? <Skeleton height={200} /> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={bySubtrack}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                <XAxis dataKey="subtrack" stroke="#555" tick={{ fontSize: 9 }} angle={-30} textAnchor="end" height={60} />
                <YAxis stroke="#555" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" fill="#F05A28" radius={[3,3,0,0]}
                  label={false}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
        <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, padding: 20 }}>
          <div style={{ fontWeight: 600, marginBottom: 16 }}>Top PRs by Movement</div>
          {loading ? <Skeleton height={200} /> : prDist.length === 0 ? (
            <div style={{ color: '#555', textAlign: 'center', padding: 40 }}>No PR data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={prDist} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                <XAxis type="number" stroke="#555" tick={{ fontSize: 11 }} />
                <YAxis dataKey="movement" type="category" stroke="#555" tick={{ fontSize: 10 }} width={120} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" fill="#F05A28" radius={[0,3,3,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </Layout>
  );
}
