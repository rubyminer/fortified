import { useState } from 'react';
import { Link } from 'wouter';
import { useMovements } from '@/hooks/use-movements';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Play } from 'lucide-react';
import { motion } from 'framer-motion';

export default function MovementsPage() {
  const { data: movements, isLoading } = useMovements();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('all');

  const categories = ['all', 'squat', 'hinge', 'press_vertical', 'press_horizontal', 'pull_vertical', 'pull_horizontal', 'carry', 'olympic', 'explosive', 'core'];

  const filtered = movements?.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === 'all' || m.category === category;
    return matchesSearch && matchesCategory;
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

      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-colors ${
              category === cat 
                ? 'bg-white text-black' 
                : 'bg-card text-muted-foreground border border-white/5'
            }`}
          >
            {cat.replace('_', ' ')}
          </button>
        ))}
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
              transition={{ delay: idx * 0.05 }}
            >
              <Link href={`/movements/${movement.id}`}>
                <Card className="hover:border-primary/50 transition-colors cursor-pointer group bg-card/60">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <h3 className="font-display text-xl text-white group-hover:text-primary transition-colors">{movement.name}</h3>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline" className="bg-background text-[10px]">{movement.category}</Badge>
                        {movement.difficulty && (
                          <Badge variant="secondary" className="text-[10px] capitalize">{movement.difficulty}</Badge>
                        )}
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <Play className="w-4 h-4 text-white ml-1 group-hover:text-primary" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-2 text-center py-10 text-muted-foreground bg-card/30 rounded-xl border border-dashed border-white/10">
              No movements found matching your criteria.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
