import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { usePRs, useCreatePR } from '@/hooks/use-prs';
import { useMovements } from '@/hooks/use-movements';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { Plus, Trophy } from 'lucide-react';
import { toast } from 'sonner';
import { PersonalRecord } from '@/lib/types';

export default function PRsPage() {
  const { user } = useAuth();
  const { data: prs, isLoading } = usePRs(user?.id);
  const { data: movements } = useMovements();
  const { mutateAsync: createPR, isPending } = useCreatePR();

  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    movement: '',
    weight_lbs: '',
    achieved_at: format(new Date(), 'yyyy-MM-dd'),
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      await createPR({
        user_id: user.id,
        movement: formData.movement,
        weight_lbs: Number(formData.weight_lbs),
        achieved_at: formData.achieved_at,
        notes: formData.notes || null
      });
      toast.success('PR Added!');
      setIsOpen(false);
      setFormData({ movement: '', weight_lbs: '', achieved_at: format(new Date(), 'yyyy-MM-dd'), notes: '' });
    } catch (err) {
      toast.error('Failed to add PR');
    }
  };

  // Group all PRs by movement, keep up to last 3 sorted ascending by date
  const groupedPRs = (prs ?? []).reduce((acc, pr) => {
    if (!acc[pr.movement]) acc[pr.movement] = [];
    acc[pr.movement].push(pr);
    return acc;
  }, {} as Record<string, PersonalRecord[]>);

  // For each movement: sort ascending by date, take the last 3
  const prGroups = Object.entries(groupedPRs).map(([movement, records]) => {
    const sorted = [...records].sort(
      (a, b) => new Date(a.achieved_at).getTime() - new Date(b.achieved_at).getTime()
    );
    const last3 = sorted.slice(-3);
    const best = Math.max(...last3.map(r => r.weight_lbs));
    return { movement, entries: last3, best };
  }).sort((a, b) => b.best - a.best);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <header>
          <h1 className="text-4xl font-display text-white tracking-wide">Hall of Records</h1>
          <p className="text-muted-foreground text-sm mt-1">Track your peak performance.</p>
        </header>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="icon" className="rounded-full shadow-lg shadow-primary/30">
              <Plus className="w-5 h-5" />
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-white/10 sm:max-w-md w-[90vw] rounded-2xl">
            <DialogHeader>
              <DialogTitle className="font-display text-2xl">Log New PR</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest font-bold text-white/70">Movement</label>
                <select
                  required
                  value={formData.movement}
                  onChange={e => setFormData({ ...formData, movement: e.target.value })}
                  className="flex h-12 w-full rounded-xl border border-white/10 bg-input/50 px-4 py-2 text-base focus:ring-2 focus:ring-primary outline-none"
                >
                  <option value="" disabled>Select movement...</option>
                  {movements?.map(m => (
                    <option key={m.id} value={m.name}>{m.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-widest font-bold text-white/70">Weight (lbs)</label>
                  <Input
                    type="number"
                    required
                    value={formData.weight_lbs}
                    onChange={e => setFormData({ ...formData, weight_lbs: e.target.value })}
                    placeholder="225"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-widest font-bold text-white/70">Date</label>
                  <Input
                    type="date"
                    required
                    value={formData.achieved_at}
                    onChange={e => setFormData({ ...formData, achieved_at: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest font-bold text-white/70">Notes (Optional)</label>
                <Input
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Felt smooth, no belt"
                />
              </div>
              <Button type="submit" className="w-full mt-4" disabled={isPending}>
                {isPending ? 'Saving...' : 'Save Record'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-10 animate-pulse text-muted-foreground">Loading records...</div>
      ) : prGroups.length > 0 ? (
        <div className="space-y-3">
          {prGroups.map(({ movement, entries, best: _ }) => (
            <Card key={movement} className="bg-card/40 border-white/5 hover:border-white/20 transition-all">
              <CardContent className="p-4 flex items-center gap-4">
                {/* Trophy icon */}
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <Trophy className="w-6 h-6 text-primary" />
                </div>

                {/* Movement name */}
                <div className="shrink-0 min-w-[100px]">
                  <h3 className="font-display text-xl text-white leading-tight">{movement}</h3>
                </div>

                {/* Progression strip */}
                <div className="flex items-center gap-1 ml-auto overflow-x-auto">
                  {entries.map((entry, i) => {
                    const isCurrent = i === entries.length - 1;
                    const delta = i > 0 ? entry.weight_lbs - entries[i - 1].weight_lbs : null;
                    return (
                      <div key={entry.id} className="flex items-center gap-1">
                        {/* Delta + arrow between entries */}
                        {i > 0 && (
                          <div className="flex flex-col items-center px-1 shrink-0">
                            {delta !== null && delta > 0 && (
                              <span className="text-[10px] font-bold text-green-400 leading-none mb-0.5">
                                +{delta}
                              </span>
                            )}
                            <span className="text-white/30 text-sm leading-none">→</span>
                          </div>
                        )}

                        {/* Weight + date column */}
                        <div className={`flex flex-col items-center shrink-0 ${isCurrent ? '' : 'opacity-50'}`}>
                          <div className={`font-display tracking-wide leading-tight ${
                            isCurrent
                              ? 'text-2xl text-primary'
                              : 'text-lg text-white'
                          }`}>
                            {entry.weight_lbs}
                            {isCurrent && (
                              <span className="text-xs font-sans font-bold text-primary/70 ml-0.5 tracking-widest">LBS</span>
                            )}
                          </div>
                          <div className="text-[10px] text-muted-foreground mt-0.5 whitespace-nowrap">
                            {format(new Date(entry.achieved_at), 'MMM d')}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="bg-card/20 border-dashed border-white/10">
          <CardContent className="p-8 text-center flex flex-col items-center">
            <Trophy className="w-12 h-12 text-white/20 mb-3" />
            <h3 className="font-display text-xl text-white/50 mb-1">No Records Yet</h3>
            <p className="text-sm text-muted-foreground">Log your first PR to start the wall of fame.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
