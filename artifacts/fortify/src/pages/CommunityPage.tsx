import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useChatMessages, useSendMessage } from '@/hooks/use-chat';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Send, Pin } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

export default function CommunityPage() {
  const { profile, user } = useAuth();
  const { data: messages, isLoading } = useChatMessages(profile?.subtrack);
  const { mutateAsync: sendMessage, isPending } = useSendMessage();
  const [content, setContent] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !user || !profile) return;
    
    try {
      await sendMessage({
        subtrack: profile.subtrack,
        user_id: user.id,
        author_name: profile.name,
        content: content.trim(),
        is_coach: false, // Coaches are set in DB manually for this demo
        is_pinned: false
      });
      setContent('');
    } catch (err) {
      console.error(err);
    }
  };

  const pinnedMsg = messages?.find(m => m.is_pinned);
  const regularMsgs = messages?.filter(m => !m.is_pinned) || [];

  const formatSubtrack = (str: string) => str?.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  return (
    <div className="flex flex-col h-[calc(100vh-140px)]">
      <header className="mb-4 shrink-0">
        <h1 className="text-3xl font-display text-white tracking-wide">Locker Room</h1>
        <p className="text-primary text-xs uppercase tracking-widest font-bold mt-1">Track: {formatSubtrack(profile?.subtrack || '')}</p>
      </header>

      {pinnedMsg && (
        <Card className="bg-primary/10 border-primary/30 mb-4 shrink-0 shadow-lg shadow-primary/5">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <Pin className="w-3 h-3 text-primary" />
              <span className="text-xs uppercase tracking-widest font-bold text-primary">Coach Announcement</span>
            </div>
            <p className="text-sm text-white/90 leading-relaxed">{pinnedMsg.content}</p>
          </CardContent>
        </Card>
      )}

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-4 pb-4 pr-2 no-scrollbar"
      >
        {isLoading ? (
          <div className="text-center text-muted-foreground animate-pulse mt-10">Syncing chat...</div>
        ) : (
          regularMsgs.map((msg, idx) => {
            const isMe = msg.user_id === user?.id;
            return (
              <motion.div 
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-baseline gap-2 mb-1 px-1">
                  {!isMe && <span className="text-xs font-bold text-white/60">{msg.author_name}</span>}
                  {msg.is_coach && <Badge className="h-4 text-[8px] px-1 bg-primary text-background border-none">COACH</Badge>}
                  {isMe && <span className="text-[10px] text-muted-foreground">{format(new Date(msg.created_at), 'h:mm a')}</span>}
                  {!isMe && <span className="text-[10px] text-muted-foreground ml-1">{format(new Date(msg.created_at), 'h:mm a')}</span>}
                </div>
                <div className={`px-4 py-2.5 rounded-2xl max-w-[85%] text-sm shadow-md ${
                  isMe 
                    ? 'bg-secondary text-white rounded-br-none border border-white/10' 
                    : msg.is_coach 
                      ? 'bg-primary text-background rounded-bl-none font-medium'
                      : 'bg-card text-white/90 rounded-bl-none border border-white/5'
                }`}>
                  {msg.content}
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      <form onSubmit={handleSend} className="shrink-0 pt-3 flex gap-2 border-t border-white/5 mt-2">
        <Input 
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Talk to your track..." 
          className="bg-card border-white/10 h-12"
          disabled={isPending}
        />
        <Button type="submit" size="icon" disabled={isPending || !content.trim()} className="h-12 w-12 shrink-0">
          <Send className="w-5 h-5" />
        </Button>
      </form>
    </div>
  );
}
