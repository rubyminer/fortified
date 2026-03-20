import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ChatMessage } from '@/lib/types';

function parseChatMessageFromBroadcast(
  raw: unknown,
  event: 'INSERT' | 'UPDATE' | 'DELETE',
): ChatMessage | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const inner = (typeof o.payload === 'object' && o.payload !== null
    ? (o.payload as Record<string, unknown>)
    : o) as Record<string, unknown>;

  const row =
    event === 'DELETE'
      ? inner.old ?? inner.old_record
      : inner.new ?? inner.record;

  if (!row || typeof row !== 'object') return null;
  const m = row as ChatMessage;
  if (!m.id || !m.subtrack) return null;
  return m;
}

export function useChatMessages(subtrack?: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!subtrack) return;

    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const apply = (event: 'INSERT' | 'UPDATE' | 'DELETE') => (msg: { payload?: unknown }) => {
      const row = parseChatMessageFromBroadcast(msg.payload ?? msg, event);
      if (!row) return;
      queryClient.setQueryData(['chat_messages', subtrack], (old: ChatMessage[] = []) => {
        if (event === 'DELETE') {
          return old.filter(m => m.id !== row.id);
        }
        const idx = old.findIndex(m => m.id === row.id);
        if (event === 'INSERT') {
          if (idx >= 0) return old;
          return [...old, row].sort(
            (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
          );
        }
        if (idx >= 0) {
          const next = [...old];
          next[idx] = row;
          return next;
        }
        return [...old, row].sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
        );
      });
    };

    void (async () => {
      await supabase.realtime.setAuth();
      if (cancelled) return;

      const topic = `chat:${subtrack}:messages`;
      channel = supabase
        .channel(topic, { config: { private: true } })
        .on('broadcast', { event: 'INSERT' }, apply('INSERT'))
        .on('broadcast', { event: 'UPDATE' }, apply('UPDATE'))
        .on('broadcast', { event: 'DELETE' }, apply('DELETE'))
        .subscribe();
    })();

    return () => {
      cancelled = true;
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [subtrack, queryClient]);

  return useQuery({
    queryKey: ['chat_messages', subtrack],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('subtrack', subtrack)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) throw error;
      return data as ChatMessage[];
    },
    enabled: !!subtrack,
  });
}

export function useSendMessage() {
  return useMutation({
    mutationFn: async (message: Omit<ChatMessage, 'id' | 'created_at'>) => {
      const { error } = await supabase.from('chat_messages').insert([message]);
      if (error) throw error;
    },
  });
}
