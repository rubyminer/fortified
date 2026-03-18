import { useState } from 'react';
import { Link } from 'wouter';
import { useMovements } from '@/hooks/use-movements';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Play } from 'lucide-react';
import { motion } from 'framer-motion';

const DISCIPLINES: { id: string; label: string }[] = [
  { id: 'all', label: 'All Disciplines' },
  { id: 'crossfit', label: 'CrossFit' },
  { id: 'hyrox', label: 'Hyrox' },
  { id: 'athx', label: 'ATHX' },
];

const CATEGORIES = ['all', 'squat', 'hinge', 'press_vertical', 'press_horizontal', 'pull_vertical', 'pull_horizontal', 'carry', 'olympic', 'explosive', 'core', 'accessory'];

export default function MovementsPage() {
  const { data: movements, isLoading } = useMovements();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [discipline, setDiscipline] = useState<string>('all');

  const filtered = movements?.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === 'all' || m.category === category;
    const matchesDiscipline = discipline === 'all' || (m.tags && m.tags.includes(discipline));
    return matchesSearch && matchesCategory && matchesDiscipline;
  }) || [];

  return (
    <div className="space-y-6">
      <header className="mb-2">
        <h1 className="text-4xl font-display text-white tracking-wide">Movement Library</h1>
        <p className="text-muted-foreground text-sm mt-1">Study the mechanics of every lift.</p>
      </header>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input 
          placeholder="Search movements..." 
          className="pl-12 bg-card border-white/10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="space-y-3">
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {DISCIPLINES.map(d => (
            <button
              key={d.id}
              onClick={() => setDiscipline(d.id)}
              className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest transition-colors ${
                discipline === d.id 
                  ? 'bg-primary text-white' 
                  : 'bg-card text-muted-foreground border border-white/5'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-colors ${
                category === cat 
                  ? 'bg-white text-black' 
                  : 'bg-card text-muted-foreground border border-white/5'
              }`}
            >
              {cat.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-10 text-muted-foreground animate-pulse">Loading library...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map((movement, idx) => (
            <motion.div 
              key={movement.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
            >
              <Link href={`/movements/${movement.id}`}>
                <Card className="hover:border-primary/50 transition-colors cursor-pointer group bg-card/60">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <h3 className="font-display text-xl text-white group-hover:text-primary transition-colors">{movement.name}</h3>
                      <div className="flex gap-2 mt-2 flex-wrap">
                        <Badge variant="outline" className="bg-background text-[10px]">{movement.category.replace(/_/g, ' ')}</Badge>
                        {movement.difficulty && (
                          <Badge variant="secondary" className="text-[10px] capitalize">{movement.difficulty}</Badge>
                        )}
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center group-hover:bg-primary/20 transition-colors flex-shrink-0 ml-3">
                      <Play className="w-4 h-4 text-white ml-1 group-hover:text-primary" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-2 text-center py-10 text-muted-foreground bg-card/30 rounded-xl border border-dashed border-white/10">
              No movements match your filters.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
