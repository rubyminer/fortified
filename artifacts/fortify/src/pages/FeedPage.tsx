import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useNextWorkout, useRecentSessions } from '@/hooks/use-workouts';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'wouter';
import { format } from 'date-fns';
import { Flame, Target, CheckCircle2, ChevronRight, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SessionWithWorkout, Sport } from '@/lib/types';
import { ALL_SUBTRACKS, sportFromSubtrack, subtrackLabel } from '@/lib/subtracks';
import { useQueryClient } from '@tanstack/react-query';

export default function FeedPage() {
  const { profile, refreshProfile } = useAuth();
  const queryClient = useQueryClient();
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const { data: nextWorkout, isLoading: isWorkoutLoading } = useNextWorkout(
    profile?.sport,
    profile?.subtrack,
    profile?.id
  );
  const { data: recentSessions, isLoading: isSessionsLoading } = useRecentSessions(profile?.id);

  const handleSwitchSubtrack = async (subtractId: string) => {
    if (!profile || subtractId === profile.subtrack || isUpdating) return;
    setIsUpdating(true);
    setSwitcherOpen(false);
    try {
      const newSport = sportFromSubtrack(subtractId) as Sport;
      const { error } = await supabase
        .from('profiles')
        .update({ subtrack: subtractId, sport: newSport })
        .eq('id', profile.id);
      if (error) throw error;
      await refreshProfile();
      queryClient.invalidateQueries({ queryKey: ['nextWorkout'] });
    } finally {
      setIsUpdating(false);
    }
  };

  if (isWorkoutLoading || isSessionsLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const currentSportLabel = ALL_SUBTRACKS.find(g => g.sport === profile?.sport)?.label ?? profile?.sport;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">

      {/* Welcome + Subtrack Switcher */}
      <section className="space-y-3">
        <div>
          <h2 className="text-sm font-semibold tracking-widest text-primary uppercase mb-1">Welcome back</h2>
          <h1 className="text-4xl font-display text-white truncate">{profile?.name}</h1>
        </div>

        {/* Current subtrack chip — tap to switch */}
        <button
          onClick={() => setSwitcherOpen(o => !o)}
          disabled={isUpdating}
          className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/15 bg-card/60 text-sm font-medium text-white hover:border-white/30 transition-all disabled:opacity-50"
        >
          <span className="text-primary text-xs font-bold uppercase tracking-widest">{currentSportLabel}</span>
          <span className="text-white/40">·</span>
          <span>{subtrackLabel(profile?.subtrack ?? '')}</span>
          <ChevronDown className={`w-4 h-4 text-white/50 transition-transform ${switcherOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Inline subtrack switcher */}
        <AnimatePresence>
          {switcherOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className="rounded-2xl border border-white/10 bg-card/80 backdrop-blur overflow-hidden"
            >
              {ALL_SUBTRACKS.map(({ sport, label, subtracks }) => (
                <div key={sport}>
                  <p className="px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    {label}
                  </p>
                  {subtracks.map(track => {
                    const isActive = profile?.subtrack === track.id;
                    return (
                      <button
                        key={track.id}
                        onClick={() => handleSwitchSubtrack(track.id)}
                        className={`w-full text-left px-4 py-3 flex items-center justify-between transition-colors ${
                          isActive
                            ? 'bg-primary/15 text-white'
                            : 'text-white/70 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        <div>
                          <span className="font-medium text-sm">{track.name}</span>
                          <p className="text-xs text-muted-foreground">{track.desc}</p>
                        </div>
                        {isActive && <div className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Today's Workout */}
      <section className="space-y-4">
        <h3 className="font-display text-2xl tracking-wide flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" /> Up Next
        </h3>

        {isUpdating ? (
          <Card className="border-white/10">
            <CardContent className="p-8 flex items-center justify-center gap-3">
              <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              <span className="text-muted-foreground text-sm">Switching track…</span>
            </CardContent>
          </Card>
        ) : nextWorkout ? (
          <Card className="border-primary/30 box-glow overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-3xl rounded-full -mr-10 -mt-10" />
            <CardHeader className="pb-2 relative z-10">
              <div className="flex justify-between items-start mb-2">
                <Badge variant="accent" className="bg-primary/20 text-primary border-primary/30">
                  Week {nextWorkout.week_number} · Day {nextWorkout.day_number}
                </Badge>
                <Badge variant="outline" className="text-white/60">
                  {subtrackLabel(nextWorkout.subtrack)}
                </Badge>
              </div>
              <CardTitle className="text-3xl mt-2">{nextWorkout.title}</CardTitle>
            </CardHeader>
            <CardContent className="relative z-10 pb-6">
              {nextWorkout.coach_note && (
                <p className="text-sm text-muted-foreground line-clamp-3 mb-6 bg-black/40 p-3 rounded-lg border border-white/5">
                  <span className="text-primary font-bold mr-2">Coach:</span>
                  {nextWorkout.coach_note}
                </p>
              )}
              <Link href={`/workout/${nextWorkout.id}`}>
                <Button className="w-full text-lg h-14 bg-gradient-to-r from-primary to-orange-500">
                  Start Session <ChevronRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-dashed border-white/20">
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">Programming complete for this track!</p>
            </CardContent>
          </Card>
        )}
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-card to-background">
          <CardContent className="p-4 flex flex-col items-center text-center">
            <Flame className="w-8 h-8 text-orange-500 mb-2" />
            <div className="text-3xl font-display text-white">{recentSessions?.length ?? 0}</div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mt-1">Sessions Logged</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-bl from-card to-background">
          <CardContent className="p-4 flex flex-col items-center text-center">
            <CheckCircle2 className="w-8 h-8 text-accent mb-2" />
            <div className="text-3xl font-display text-white">Active</div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mt-1">Status</div>
          </CardContent>
        </Card>
      </section>

      {/* Recent History */}
      <section className="space-y-4">
        <h3 className="font-display text-2xl tracking-wide">Recent History</h3>
        {recentSessions && recentSessions.length > 0 ? (
          <div className="space-y-3">
            {(recentSessions as SessionWithWorkout[]).map((session) => (
              <Card key={session.id} className="bg-card/40 border-white/5 hover:border-white/10 transition-colors">
                <CardContent className="p-4 flex justify-between items-center">
                  <div>
                    <h4 className="font-display text-lg">{session.workouts?.title ?? 'Workout'}</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      W{session.week_number}D{session.day_number} · {format(new Date(session.completed_at), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-green-500 opacity-80" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic text-center py-6 bg-card/30 rounded-xl border border-dashed border-white/10">
            No completed sessions yet. Get to work!
          </p>
        )}
      </section>

    </motion.div>
  );
}
