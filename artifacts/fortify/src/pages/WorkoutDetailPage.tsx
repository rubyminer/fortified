import { useState } from 'react';
import { useRoute, useLocation, Link } from 'wouter';
import { useWorkout, useCompleteWorkout } from '@/hooks/use-workouts';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, Info, PlayCircle, Check, Timer } from 'lucide-react';
import { toast } from 'sonner';
import { SetLog, WorkoutExercise } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';

export default function WorkoutDetailPage() {
  const [, params] = useRoute('/workout/:id');
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { data: workout, isLoading } = useWorkout(params?.id || '');
  const { mutateAsync: completeWorkout, isPending } = useCompleteWorkout();

  const [loggedSets, setLoggedSets] = useState<Partial<SetLog>[]>([]);
  const [activeExerciseIndex, setActiveExerciseIndex] = useState(0);

  if (isLoading) return <div className="p-6 text-center text-muted-foreground mt-20">Loading workout...</div>;
  if (!workout) return <div className="p-6 text-center text-destructive mt-20">Workout not found</div>;

  const allExercises = [
    ...(workout.main_work || []),
    ...(workout.accessory || [])
  ];

  const handleLogSet = (exercise: WorkoutExercise, setIndex: number, weight: number, reps: number, rpe: number) => {
    const newSet: Partial<SetLog> = {
      exercise_name: exercise.name,
      movement_id: exercise.movement_id,
      set_number: setIndex + 1,
      weight_lbs: weight || null,
      reps: reps || null,
      rpe_actual: rpe || null,
      logged_at: new Date().toISOString()
    };
    
    setLoggedSets(prev => {
      const existing = prev.findIndex(s => s.exercise_name === exercise.name && s.set_number === setIndex + 1);
      if (existing >= 0) {
        const next = [...prev];
        next[existing] = newSet;
        return next;
      }
      return [...prev, newSet];
    });
    toast.success(`Set ${setIndex + 1} logged`);
  };

  const handleComplete = async () => {
    if (!user) return;
    try {
      await completeWorkout({
        session: {
          user_id: user.id,
          discipline: workout.discipline,
          subtrack: workout.subtrack,
          week_number: workout.week_number,
          day_number: workout.day_number,
          workout_id: workout.id,
        },
        sets: loggedSets
      });
      toast.success('Session completed and saved!');
      setLocation('/');
    } catch {
      toast.error('Failed to save session');
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setLocation('/')} className="rounded-full bg-card">
          <ChevronLeft className="w-6 h-6" />
        </Button>
        <div>
          <h2 className="text-primary text-xs font-bold uppercase tracking-widest">W{workout.week_number} • D{workout.day_number}</h2>
          <h1 className="text-2xl font-display text-white tracking-wide">{workout.title}</h1>
        </div>
      </div>

      {workout.coach_note && (
        <Card className="bg-primary/10 border-primary/30">
          <CardContent className="p-4 flex gap-3">
            <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <p className="text-sm text-white/90 leading-relaxed">{workout.coach_note}</p>
          </CardContent>
        </Card>
      )}

      {workout.warmup && workout.warmup.length > 0 && (
        <section>
          <h3 className="font-display text-xl mb-3 text-white">Warmup</h3>
          <Card className="bg-card/50">
            <CardContent className="p-4">
              <ul className="space-y-2">
                {workout.warmup.map((item, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex gap-2">
                    <span className="text-primary">•</span> {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </section>
      )}

      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        {allExercises.map((ex, idx) => (
          <button
            key={idx}
            onClick={() => setActiveExerciseIndex(idx)}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-colors ${
              idx === activeExerciseIndex 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-card text-muted-foreground border border-white/5'
            }`}
          >
            {ex.name}
          </button>
        ))}
      </div>

      <section>
        <AnimatePresence mode="wait">
          {allExercises.map((exercise, idx) => {
            if (idx !== activeExerciseIndex) return null;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-display text-3xl text-white tracking-wide">{exercise.name}</h3>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="outline" className="bg-background">{exercise.sets} Sets</Badge>
                      <Badge variant="outline" className="bg-background">{exercise.reps} Reps</Badge>
                      <Badge variant="outline" className="bg-background">RPE {exercise.rpe_target}</Badge>
                      <Badge variant="outline" className="bg-background flex gap-1"><Timer className="w-3 h-3"/> {exercise.rest_seconds}s</Badge>
                    </div>
                  </div>
                  <Link href={`/movements/${exercise.movement_id}`}>
                    <Button variant="ghost" size="icon" className="text-accent hover:text-accent/80 hover:bg-accent/10">
                      <PlayCircle className="w-8 h-8" />
                    </Button>
                  </Link>
                </div>
                
                <p className="text-sm text-muted-foreground border-l-2 border-white/20 pl-3">
                  {exercise.description}
                </p>

                <div className="space-y-3 pt-4">
                  <h4 className="text-xs uppercase tracking-widest text-white/50 font-bold mb-2">Log Sets</h4>
                  {Array.from({ length: exercise.sets }).map((_, setIdx) => {
                    const existingLog = loggedSets.find(s => s.exercise_name === exercise.name && s.set_number === setIdx + 1);
                    return (
                      <SetRow 
                        key={setIdx} 
                        setIndex={setIdx} 
                        existingLog={existingLog}
                        onSave={(w, r, rpe) => handleLogSet(exercise, setIdx, w, r, rpe)} 
                      />
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </section>

      <div className="pt-8 border-t border-white/10 mt-8">
        <Button 
          className="w-full h-14 text-lg bg-green-600 hover:bg-green-500 shadow-green-600/20 shadow-lg"
          onClick={handleComplete}
          disabled={isPending}
        >
          {isPending ? 'Saving...' : 'Finish & Save Session'}
        </Button>
      </div>
    </div>
  );
}

function SetRow({ setIndex, existingLog, onSave }: { 
  setIndex: number, 
  existingLog?: Partial<SetLog>,
  onSave: (weight: number, reps: number, rpe: number) => void 
}) {
  const [weight, setWeight] = useState(existingLog?.weight_lbs?.toString() || '');
  const [reps, setReps] = useState(existingLog?.reps?.toString() || '');
  const [rpe, setRpe] = useState(existingLog?.rpe_actual?.toString() || '');

  return (
    <div className="flex items-center gap-2 bg-card/40 p-2 rounded-xl border border-white/5">
      <div className="w-8 text-center text-xs font-bold text-muted-foreground">{setIndex + 1}</div>
      <Input 
        type="number" 
        placeholder="Lbs" 
        value={weight} 
        onChange={e => setWeight(e.target.value)}
        className="h-10 text-center font-mono"
      />
      <Input 
        type="number" 
        placeholder="Reps" 
        value={reps} 
        onChange={e => setReps(e.target.value)}
        className="h-10 text-center font-mono"
      />
      <Input 
        type="number" 
        placeholder="RPE" 
        value={rpe} 
        onChange={e => setRpe(e.target.value)}
        className="h-10 text-center font-mono"
      />
      <Button 
        size="icon" 
        variant={existingLog ? "default" : "secondary"}
        className={`h-10 w-12 shrink-0 ${existingLog ? 'bg-accent hover:bg-accent/80' : ''}`}
        onClick={() => onSave(Number(weight), Number(reps), Number(rpe))}
      >
        <Check className="w-4 h-4" />
      </Button>
    </div>
  );
}
