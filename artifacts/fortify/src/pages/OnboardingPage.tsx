import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useAllSubtrackConfig, type SubtrackConfigRow } from '@/hooks/use-subtrack-config';
import { formatSessionsPerWeekLabel } from '@/lib/frequency-label';

interface DisciplineRow {
  id: string;
  label: string;
  sort_order: number;
}

export default function OnboardingPage() {
  const { user, refreshProfile } = useAuth();
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: configRows = [], isLoading: configLoading } = useAllSubtrackConfig();
  const { data: disciplines = [] } = useQuery({
    queryKey: ['disciplines-active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('disciplines')
        .select('id, label, sort_order')
        .eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      return (data ?? []) as DisciplineRow[];
    },
  });

  const groupedConfig = useMemo(() => {
    const order = new Map(disciplines.map((d, i) => [d.id, d.sort_order ?? i]));
    const byDisc = new Map<string, SubtrackConfigRow[]>();
    for (const row of configRows) {
      const list = byDisc.get(row.discipline) ?? [];
      list.push(row);
      byDisc.set(row.discipline, list);
    }
    for (const list of byDisc.values()) {
      list.sort((a, b) => a.display_name.localeCompare(b.display_name));
    }
    return [...byDisc.entries()]
      .sort((a, b) => (order.get(a[0]) ?? 0) - (order.get(b[0]) ?? 0))
      .map(([discipline, rows]) => ({
        discipline,
        label: disciplines.find(d => d.id === discipline)?.label ?? discipline,
        rows,
      }));
  }, [configRows, disciplines]);

  const [formData, setFormData] = useState({
    name: '',
    subtrack: '',
  });

  const selectedRow = configRows.find(r => r.subtrack === formData.subtrack);
  const selectedDiscipline = selectedRow?.discipline ?? null;

  const handleSubmit = async () => {
    if (!user || !selectedRow) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('profiles').insert([
        {
          id: user.id,
          name: formData.name,
          discipline: selectedRow.discipline,
          subtrack: selectedRow.subtrack,
          level: 'intermediate',
          frequency: selectedRow.base_days_per_week,
          is_beta: true,
        },
      ]);
      if (error) throw error;
      await refreshProfile();
      toast.success('Profile created! Welcome to Fortify.');
      setLocation('/feed');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create profile';
      toast.error(message);
      setIsSubmitting(false);
    }
  };

  const slideVariants = {
    enter: (direction: number) => ({ x: direction > 0 ? 50 : -50, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (direction: number) => ({ x: direction < 0 ? 50 : -50, opacity: 0 }),
  };

  return (
    <div className="min-h-screen bg-background flex flex-col p-6">
      <div className="flex-1 flex flex-col max-w-lg w-full mx-auto justify-center relative">
        <div className="absolute top-10 left-0 right-0">
          <div className="flex justify-between mb-2">
            {[1, 2].map(i => (
              <div
                key={i}
                className={`h-1.5 flex-1 mx-1 rounded-full transition-colors ${i <= step ? 'bg-primary' : 'bg-secondary'}`}
              />
            ))}
          </div>
          <p className="text-center text-xs uppercase tracking-widest text-muted-foreground mt-4">
            Step {step} of 2
          </p>
        </div>

        <AnimatePresence mode="wait" custom={1}>
          <motion.div
            key={step}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="w-full mt-24"
          >
            {step === 1 && (
              <div className="space-y-6">
                <h2 className="text-4xl font-display uppercase tracking-wider">Athlete Profile</h2>
                <p className="text-muted-foreground">What should we call you on the leaderboard?</p>
                <Input
                  autoFocus
                  placeholder="Your Name"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="h-14 text-lg"
                  onKeyDown={e => e.key === 'Enter' && formData.name.trim() && setStep(2)}
                />
                <Button className="w-full" onClick={() => setStep(2)} disabled={!formData.name.trim()}>
                  Continue
                </Button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-4xl font-display uppercase tracking-wider">Starting Track</h2>
                  <p className="text-muted-foreground mt-2">
                    Pick a focus area to begin. You can switch at any time.
                  </p>
                </div>

                {configLoading ? (
                  <p className="text-sm text-muted-foreground">Loading tracks…</p>
                ) : groupedConfig.length === 0 ? (
                  <p className="text-sm text-destructive">
                    No track configuration found. Ask your coach to seed{' '}
                    <code className="text-xs">subtrack_config</code> in Supabase.
                  </p>
                ) : (
                  <div className="space-y-6 max-h-[55vh] overflow-y-auto pr-1">
                    {groupedConfig.map(({ discipline, label, rows }) => (
                      <div key={discipline}>
                        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                          {label}
                        </p>
                        <div className="space-y-2">
                          {rows.map(row => {
                            const freq = formatSessionsPerWeekLabel(
                              row.base_days_per_week,
                              row.flex_days_per_week,
                            );
                            const selected = formData.subtrack === row.subtrack;
                            return (
                              <Card
                                key={row.id}
                                className={`cursor-pointer transition-all duration-200 ${
                                  selected
                                    ? 'border-primary ring-1 ring-primary/50 bg-primary/10'
                                    : 'hover:border-white/20'
                                }`}
                                onClick={() => setFormData({ ...formData, subtrack: row.subtrack })}
                              >
                                <CardContent className="p-4 space-y-2">
                                  <div className="flex items-start justify-between gap-2">
                                    <h3 className="font-display text-lg text-white">{row.display_name}</h3>
                                    <div className="flex flex-col items-end gap-1 shrink-0">
                                      <Badge
                                        variant="outline"
                                        className="text-[10px] uppercase tracking-wider border-primary/40 text-primary/90"
                                      >
                                        {freq}
                                      </Badge>
                                      {selected && (
                                        <div className="w-3 h-3 rounded-full bg-primary" aria-hidden />
                                      )}
                                    </div>
                                  </div>
                                  {row.description && (
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                      {row.description}
                                    </p>
                                  )}
                                  {row.who_its_for && (
                                    <div className="pt-1 border-t border-white/5">
                                      <p className="text-[10px] font-bold uppercase tracking-widest text-primary/80 mb-0.5">
                                        Is this you?
                                      </p>
                                      <p className="text-xs text-muted-foreground leading-relaxed">
                                        {row.who_its_for}
                                      </p>
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {selectedDiscipline && (
                  <p className="text-xs text-center text-muted-foreground">
                    Discipline:{' '}
                    <span className="text-primary font-semibold capitalize">{selectedDiscipline}</span>
                  </p>
                )}

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                    Back
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleSubmit}
                    disabled={!formData.subtrack || isSubmitting || configRows.length === 0}
                  >
                    {isSubmitting ? 'Building Profile...' : 'Start Training'}
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
