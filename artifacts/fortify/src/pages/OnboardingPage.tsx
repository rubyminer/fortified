import { useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Sport } from '@/lib/types';
import { useSubtracks, buildSportFromSubtrack } from '@/hooks/use-subtracks';
import { ALL_SUBTRACKS } from '@/lib/subtracks';

export default function OnboardingPage() {
  const { user, refreshProfile } = useAuth();
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: subtracks = ALL_SUBTRACKS } = useSubtracks();
  const getSport = buildSportFromSubtrack(subtracks);

  const [formData, setFormData] = useState({
    name: '',
    subtrack: '',
  });

  const selectedSport = formData.subtrack ? getSport(formData.subtrack) : null;

  const handleSubmit = async () => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      const sport = getSport(formData.subtrack) as Sport;
      const { error } = await supabase.from('profiles').insert([{
        id: user.id,
        name: formData.name,
        sport,
        subtrack: formData.subtrack,
        level: 'intermediate',
        frequency: 3,
        is_beta: true
      }]);
      if (error) throw error;
      await refreshProfile();
      toast.success('Profile created! Welcome to Fortify.');
      setLocation('/');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create profile';
      toast.error(message);
      setIsSubmitting(false);
    }
  };

  const slideVariants = {
    enter: (direction: number) => ({ x: direction > 0 ? 50 : -50, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (direction: number) => ({ x: direction < 0 ? 50 : -50, opacity: 0 })
  };

  return (
    <div className="min-h-screen bg-background flex flex-col p-6">
      <div className="flex-1 flex flex-col max-w-lg w-full mx-auto justify-center relative">
        <div className="absolute top-10 left-0 right-0">
          <div className="flex justify-between mb-2">
            {[1, 2].map(i => (
              <div key={i} className={`h-1.5 flex-1 mx-1 rounded-full transition-colors ${i <= step ? 'bg-primary' : 'bg-secondary'}`} />
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
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
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
                <Button
                  className="w-full"
                  onClick={() => setStep(2)}
                  disabled={!formData.name.trim()}
                >
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

                <div className="space-y-6">
                  {subtracks.map(({ sport, label, subtracks: tracks }) => (
                    <div key={sport}>
                      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">{label}</p>
                      <div className="space-y-2">
                        {tracks.map(track => (
                          <Card
                            key={track.id}
                            className={`cursor-pointer transition-all duration-200 ${formData.subtrack === track.id ? 'border-primary ring-1 ring-primary/50 bg-primary/10' : 'hover:border-white/20'}`}
                            onClick={() => setFormData({ ...formData, subtrack: track.id })}
                          >
                            <CardContent className="p-4 flex items-center justify-between">
                              <div>
                                <h3 className="font-display text-lg text-white">{track.name}</h3>
                                <p className="text-xs text-muted-foreground mt-0.5">{track.desc}</p>
                              </div>
                              {formData.subtrack === track.id && (
                                <div className="w-3 h-3 rounded-full bg-primary shrink-0 ml-3" />
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {selectedSport && (
                  <p className="text-xs text-center text-muted-foreground">
                    Sport: <span className="text-primary font-semibold capitalize">{selectedSport}</span>
                  </p>
                )}

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(1)} className="flex-1">Back</Button>
                  <Button
                    className="flex-1"
                    onClick={handleSubmit}
                    disabled={!formData.subtrack || isSubmitting}
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
