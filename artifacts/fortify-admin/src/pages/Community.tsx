import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Layout } from '@/components/Layout';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { SkeletonTable } from '@/components/Skeleton';
import { useToast } from '@/components/Toast';
import { useAuth } from '@/hooks/use-auth';
import { DISCIPLINE_SUBTRACKS } from '@/lib/utils';
import type { ChatMessage, FeedLike } from '@/lib/types';

const DISCIPLINES = ['crossfit', 'hyrox', 'athx'];

export function Community() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [tab, setTab] = useState<'chat' | 'likes'>('chat');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [likes, setLikes] = useState<(FeedLike & { profiles: { name: string } | null })[]>([]);
  const [loading, setLoading] = useState(true);

  const [disciplineFilter, setDisciplineFilter] = useState('all');
  const [subtrackFilter, setSubtrackFilter] = useState('all');
  const [coachOnly, setCoachOnly] = useState(false);
  const [pinnedOnly, setPinnedOnly] = useState(false);
  const [search, setSearch] = useState('');

  const [postDiscipline, setPostDiscipline] = useState('crossfit');
  const [postSubtrack, setPostSubtrack] = useState('overhead_shoulder_strength');
  const [postContent, setPostContent] = useState('');
  const [postPinned, setPostPinned] = useState(false);
  const [posting, setPosting] = useState(false);

  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('chat_messages').select('*').order('created_at', { ascending: false }).limit(200);
    setMessages((data ?? []) as ChatMessage[]);
    setLoading(false);
  }, []);

  const fetchLikes = useCallback(async () => {
    const { data } = await supabase.from('feed_likes').select('*, profiles(name)').order('created_at', { ascending: false }).limit(100);
    setLikes((data ?? []) as any);
  }, []);

  useEffect(() => { fetchMessages(); fetchLikes(); }, [fetchMessages, fetchLikes]);

  async function postMessage() {
    if (!postContent.trim()) return;
    setPosting(true);
    const { error } = await supabase.from('chat_messages').insert({
      subtrack: postSubtrack,
      user_id: user!.id,
      author_name: 'Coach',
      content: postContent.trim(),
      is_coach: true,
      is_pinned: postPinned,
    });
    setPosting(false);
    if (error) { showToast(error.message, 'error'); return; }
    showToast('Message posted', 'success');
    setPostContent('');
    setPostPinned(false);
    fetchMessages();
  }

  async function togglePin(msg: ChatMessage) {
    const { error } = await supabase.from('chat_messages').update({ is_pinned: !msg.is_pinned }).eq('id', msg.id);
    if (!error) { showToast(msg.is_pinned ? 'Unpinned' : 'Pinned', 'info'); fetchMessages(); }
  }

  async function deleteMessage() {
    if (!confirmId) return;
    setDeleting(true);
    await supabase.from('chat_messages').delete().eq('id', confirmId);
    setDeleting(false); setConfirmId(null);
    showToast('Message deleted', 'info');
    fetchMessages();
  }

  const postSubtracks = DISCIPLINE_SUBTRACKS[postDiscipline] ?? [];
  const filterSubtracks = disciplineFilter !== 'all' ? (DISCIPLINE_SUBTRACKS[disciplineFilter] ?? []) : [];

  const filtered = messages
    .filter(m => disciplineFilter === 'all' || m.subtrack?.startsWith(disciplineFilter.substring(0, 3)) || filterSubtracks.some(s => s.id === m.subtrack))
    .filter(m => subtrackFilter === 'all' || m.subtrack === subtrackFilter)
    .filter(m => !coachOnly || m.is_coach)
    .filter(m => !pinnedOnly || m.is_pinned)
    .filter(m => !search || m.content.toLowerCase().includes(search.toLowerCase()));

  return (
    <Layout section="Community">
      <div className="section-header">
        <h1 className="section-title">Community</h1>
      </div>
      <div className="sub-tabs">
        <button className={`sub-tab ${tab === 'chat' ? 'active' : ''}`} onClick={() => setTab('chat')}>Chat Messages</button>
        <button className={`sub-tab ${tab === 'likes' ? 'active' : ''}`} onClick={() => setTab('likes')}>Feed Likes</button>
      </div>

      {tab === 'chat' && <>
        <div className="coach-panel">
          <div style={{ fontWeight: 600, marginBottom: 16 }}>Post as Coach</div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
            <select value={postDiscipline} onChange={e => { setPostDiscipline(e.target.value); setPostSubtrack(DISCIPLINE_SUBTRACKS[e.target.value]?.[0]?.id ?? ''); }} style={{ width: 160 }}>
              {DISCIPLINES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={postSubtrack} onChange={e => setPostSubtrack(e.target.value)} style={{ width: 200 }}>
              {postSubtracks.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <textarea rows={3} value={postContent} onChange={e => setPostContent(e.target.value)} placeholder="Type your coach message…" style={{ marginBottom: 10 }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', textTransform: 'none', marginBottom: 0, fontSize: 13, color: '#888' }}>
              <input type="checkbox" checked={postPinned} onChange={e => setPostPinned(e.target.checked)} style={{ width: 'auto', cursor: 'pointer' }} />
              Pin this message
            </label>
            <button className="btn btn-primary" onClick={postMessage} disabled={posting || !postContent.trim()}>
              {posting ? 'Posting…' : 'Post Message'}
            </button>
          </div>
        </div>

        <div className="filter-bar">
          <select value={disciplineFilter} onChange={e => { setDisciplineFilter(e.target.value); setSubtrackFilter('all'); }} style={{ width: 160 }}>
            <option value="all">All Disciplines</option>
            {DISCIPLINES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          {disciplineFilter !== 'all' && (
            <select value={subtrackFilter} onChange={e => setSubtrackFilter(e.target.value)} style={{ width: 200 }}>
              <option value="all">All Subtracks</option>
              {filterSubtracks.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          )}
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', textTransform: 'none', marginBottom: 0, fontSize: 13, color: '#888', whiteSpace: 'nowrap' }}>
            <input type="checkbox" checked={coachOnly} onChange={e => setCoachOnly(e.target.checked)} style={{ width: 'auto' }} /> Coach only
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', textTransform: 'none', marginBottom: 0, fontSize: 13, color: '#888', whiteSpace: 'nowrap' }}>
            <input type="checkbox" checked={pinnedOnly} onChange={e => setPinnedOnly(e.target.checked)} style={{ width: 'auto' }} /> Pinned only
          </label>
          <input placeholder="Search messages…" value={search} onChange={e => setSearch(e.target.value)} style={{ minWidth: 200 }} />
        </div>

        <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, overflow: 'hidden' }}>
          {loading ? <div style={{ padding: 16 }}><SkeletonTable cols={5} /></div> : (
            <table className="data-table">
              <thead><tr>
                <th>Subtrack</th><th>Author</th><th style={{ minWidth: 260 }}>Message</th><th>Badges</th><th>Posted</th><th>Actions</th>
              </tr></thead>
              <tbody>
                {filtered.map(m => (
                  <tr key={m.id}>
                    <td style={{ fontSize: 12, color: '#888' }}>{m.subtrack?.replace(/_/g,' ')}</td>
                    <td style={{ fontWeight: 500 }}>{m.author_name}</td>
                    <td style={{ maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#ccc' }}>{m.content}</td>
                    <td style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      {m.is_coach && <span className="badge badge-coach">Coach</span>}
                      {m.is_pinned && <span className="badge badge-pinned">Pinned</span>}
                    </td>
                    <td style={{ fontSize: 12, color: '#888' }}>{new Date(m.created_at).toLocaleDateString()}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-ghost btn-icon btn-sm" title={m.is_pinned ? 'Unpin' : 'Pin'} onClick={() => togglePin(m)}>
                          {m.is_pinned ? '📌' : '📍'}
                        </button>
                        <button className="btn btn-ghost btn-icon btn-sm" title="Delete" onClick={() => setConfirmId(m.id)} style={{ color: '#ef4444' }}>🗑</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && <tr><td colSpan={6} style={{ color: '#555', textAlign: 'center', padding: 32 }}>No messages found</td></tr>}
              </tbody>
            </table>
          )}
        </div>
      </>}

      {tab === 'likes' && (
        <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, overflow: 'hidden' }}>
          <table className="data-table">
            <thead><tr><th>Athlete</th><th>Feed Item ID</th><th>Liked At</th></tr></thead>
            <tbody>
              {likes.map(l => (
                <tr key={l.id}>
                  <td>{l.profiles?.name ?? '—'}</td>
                  <td style={{ color: '#888', fontSize: 12, fontFamily: 'monospace' }}>{l.feed_item_id}</td>
                  <td style={{ fontSize: 12, color: '#888' }}>{new Date(l.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
              {likes.length === 0 && <tr><td colSpan={3} style={{ color: '#555', textAlign: 'center', padding: 32 }}>No likes yet</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {confirmId && (
        <ConfirmDialog
          title="Delete Message"
          message="This will permanently delete this message. This action cannot be undone."
          onConfirm={deleteMessage}
          onCancel={() => setConfirmId(null)}
          loading={deleting}
        />
      )}
    </Layout>
  );
}
