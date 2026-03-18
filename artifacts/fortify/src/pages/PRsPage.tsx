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

  // Group PRs by movement to show highest/latest
  const groupedPRs = prs?.reduce((acc, pr) => {
    if (!acc[pr.movement]) {
      acc[pr.movement] = pr; // assume sorted by date DESC from hook
    } else if (pr.weight_lbs > acc[pr.movement].weight_lbs) {
      acc[pr.movement] = pr; // keep highest weight if multiple exist
    }
    return acc;
  }, {} as Record<string, any>);

  const prList = Object.values(groupedPRs || {}).sort((a, b) => b.weight_lbs - a.weight_lbs);

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
                  onChange={e => setFormData({...formData, movement: e.target.value})}
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
                    onChange={e => setFormData({...formData, weight_lbs: e.target.value})}
                    placeholder="225"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-widest font-bold text-white/70">Date</label>
                  <Input 
                    type="date" 
                    required 
                    value={formData.achieved_at}
                    onChange={e => setFormData({...formData, achieved_at: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest font-bold text-white/70">Notes (Optional)</label>
                <Input 
                  value={formData.notes}
                  onChange={e => setFormData({...formData, notes: e.target.value})}
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
      ) : prList.length > 0 ? (
        <div className="space-y-3">
          {prList.map((pr) => (
            <Card key={pr.id} className="bg-card/40 border-white/5 hover:border-white/20 transition-all">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                    <Trophy className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-display text-xl text-white">{pr.movement}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{format(new Date(pr.achieved_at), 'MMM d, yyyy')}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-display text-3xl text-accent tracking-wide">{pr.weight_lbs}</div>
                  <div className="text-[10px] uppercase font-bold text-muted-foreground -mt-1">LBS</div>
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
