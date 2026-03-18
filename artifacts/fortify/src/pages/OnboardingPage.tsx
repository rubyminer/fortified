import { useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Sport, Level } from '@/lib/types';

const SPORTS = [
  { id: 'hyrox', name: 'Hyrox', desc: 'Hybrid endurance racing' },
  { id: 'crossfit', name: 'CrossFit', desc: 'High-intensity functional fitness' },
  { id: 'athx', name: 'ATHX', desc: 'Explosive power and conditioning' }
];

const SUBTRACKS: Record<string, {id: string, name: string}[]> = {
  hyrox: [
    { id: 'sled_carry_strength', name: 'Sled & Carry Strength' },
    { id: 'running_economy', name: 'Running Economy' },
    { id: 'upper_body_push', name: 'Upper Body Push' }
  ],
  crossfit: [
    { id: 'overhead_shoulder_strength', name: 'Overhead & Shoulder' },
    { id: 'lower_body_strength', name: 'Lower Body Strength' },
    { id: 'engine_builder', name: 'Engine Builder' }
  ],
  athx: [
    { id: 'explosive_power', name: 'Explosive Power' },
    { id: 'maximal_strength', name: 'Maximal Strength' },
    { id: 'conditioning', name: 'Conditioning' }
  ]
};

const LEVELS = ['beginner', 'intermediate', 'advanced'] as Level[];
const FREQUENCIES = [2, 3, 4];

export default function OnboardingPage() {
  const { user, refreshProfile } = useAuth();
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    sport: '' as Sport,
    subtrack: '',
    level: '' as Level,
    frequency: 3
  });

  const handleNext = () => setStep(s => s + 1);
  const handleBack = () => setStep(s => s - 1);

  const handleSubmit = async () => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('profiles').insert([{
        id: user.id,
        ...formData,
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
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className={`h-1.5 flex-1 mx-1 rounded-full ${i <= step ? 'bg-primary' : 'bg-secondary'}`} />
            ))}
          </div>
          <p className="text-center text-xs uppercase tracking-widest text-muted-foreground mt-4">
            Step {step} of 5
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
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="h-14 text-lg"
                />
                <Button 
                  className="w-full" 
                  onClick={handleNext} 
                  disabled={!formData.name.trim()}
                >
                  Continue
                </Button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <h2 className="text-4xl font-display uppercase tracking-wider">Select Sport</h2>
                <p className="text-muted-foreground">Choose your primary competition focus.</p>
                <div className="space-y-3">
                  {SPORTS.map(sport => (
                    <Card 
                      key={sport.id}
                      className={`cursor-pointer transition-all duration-300 ${formData.sport === sport.id ? 'border-primary ring-1 ring-primary/50 bg-primary/10' : 'hover:border-white/20'}`}
                      onClick={() => setFormData({...formData, sport: sport.id as Sport, subtrack: ''})}
                    >
                      <CardContent className="p-5">
                        <h3 className="text-xl font-display text-white">{sport.name}</h3>
                        <p className="text-sm text-muted-foreground">{sport.desc}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={handleBack} className="flex-1">Back</Button>
                  <Button className="flex-1" onClick={handleNext} disabled={!formData.sport}>Continue</Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <h2 className="text-4xl font-display uppercase tracking-wider">Focus Area</h2>
                <p className="text-muted-foreground">Select a specific subtrack to build your foundation.</p>
                <div className="space-y-3">
                  {SUBTRACKS[formData.sport]?.map(track => (
                    <Card 
                      key={track.id}
                      className={`cursor-pointer transition-all duration-300 ${formData.subtrack === track.id ? 'border-primary ring-1 ring-primary/50 bg-primary/10' : 'hover:border-white/20'}`}
                      onClick={() => setFormData({...formData, subtrack: track.id})}
                    >
                      <CardContent className="p-5">
                        <h3 className="text-xl font-display text-white">{track.name}</h3>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={handleBack} className="flex-1">Back</Button>
                  <Button className="flex-1" onClick={handleNext} disabled={!formData.subtrack}>Continue</Button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6">
                <h2 className="text-4xl font-display uppercase tracking-wider">Experience Level</h2>
                <div className="space-y-3">
                  {LEVELS.map(level => (
                    <Card 
                      key={level}
                      className={`cursor-pointer transition-all duration-300 ${formData.level === level ? 'border-primary ring-1 ring-primary/50 bg-primary/10' : 'hover:border-white/20'}`}
                      onClick={() => setFormData({...formData, level})}
                    >
                      <CardContent className="p-5 capitalize">
                        <h3 className="text-xl font-display text-white">{level}</h3>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={handleBack} className="flex-1">Back</Button>
                  <Button className="flex-1" onClick={handleNext} disabled={!formData.level}>Continue</Button>
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-6">
                <h2 className="text-4xl font-display uppercase tracking-wider">Training Frequency</h2>
                <p className="text-muted-foreground">Days per week you will commit to this track.</p>
                <div className="flex gap-4">
                  {FREQUENCIES.map(freq => (
                    <button
                      key={freq}
                      onClick={() => setFormData({...formData, frequency: freq})}
                      className={`flex-1 h-24 rounded-2xl flex flex-col items-center justify-center border-2 transition-all duration-300 ${formData.frequency === freq ? 'border-primary bg-primary/20 text-white' : 'border-white/10 bg-card text-muted-foreground hover:bg-white/5'}`}
                    >
                      <span className="text-3xl font-display">{freq}</span>
                      <span className="text-xs uppercase tracking-widest font-semibold">Days</span>
                    </button>
                  ))}
                </div>
                <div className="flex gap-3 mt-8">
                  <Button variant="outline" onClick={handleBack} className="flex-1">Back</Button>
                  <Button 
                    className="flex-1" 
                    onClick={handleSubmit} 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Building Profile...' : 'Complete'}
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
