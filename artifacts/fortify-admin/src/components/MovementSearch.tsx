import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Movement } from '@/lib/types';

interface Props {
  value: string;
  onSelect: (m: Movement) => void;
  placeholder?: string;
}

export function MovementSearch({ value, onSelect, placeholder = 'Search movements…' }: Props) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<Movement[]>([]);
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setQuery(value); }, [value]);

  useEffect(() => {
    clearTimeout(timer.current);
    if (query.length < 2) { setResults([]); return; }
    timer.current = setTimeout(async () => {
      const { data } = await supabase
        .from('movements')
        .select('id, name, category, description, subcategory, tags, difficulty, equipment, primary_muscles, secondary_muscles, youtube_url, youtube_embed_id, cue_points, is_active')
        .ilike('name', `%${query}%`)
        .eq('is_active', true)
        .limit(10);
      setResults((data ?? []) as Movement[]);
      setOpen(true);
    }, 300);
  }, [query]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <input
        value={query}
        onChange={e => { setQuery(e.target.value); }}
        onFocus={() => { if (results.length > 0) setOpen(true); }}
        placeholder={placeholder}
      />
      {open && results.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
          background: '#1a1a1a', border: '1px solid #3a3a3a', borderRadius: 6,
          marginTop: 2, maxHeight: 240, overflowY: 'auto',
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
        }}>
          {results.map(m => (
            <div
              key={m.id}
              style={{ padding: '9px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}
              onMouseDown={() => { onSelect(m); setQuery(m.name); setOpen(false); }}
              onMouseEnter={e => (e.currentTarget.style.background = '#222')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <span style={{ flex: 1, fontSize: 14 }}>{m.name}</span>
              <span style={{ fontSize: 11, color: '#888', background: '#2a2a2a', padding: '2px 6px', borderRadius: 4 }}>
                {m.category?.replace(/_/g, ' ')}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
