import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ChatMessage } from '@/lib/types';

export function useChatMessages(subtrack?: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!subtrack) return;

    const channel = supabase
      .channel(`public:chat_messages:subtrack=eq.${subtrack}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `subtrack=eq.${subtrack}`,
        },
        (payload) => {
          queryClient.setQueryData(
            ['chat_messages', subtrack],
            (old: ChatMessage[] = []) => {
              // Avoid duplicates
              if (old.find(m => m.id === payload.new.id)) return old;
              return [...old, payload.new as ChatMessage].sort((a, b) => 
                new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
              );
            }
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
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
      const { error } = await supabase
        .from('chat_messages')
        .insert([message]);
      if (error) throw error;
    }
  });
}
