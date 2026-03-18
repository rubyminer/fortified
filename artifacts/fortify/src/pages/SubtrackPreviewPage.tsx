import { useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';
import { useSubtracks, buildSportFromSubtrack } from '@/hooks/use-subtracks';
import { getSubtrackDetail } from '@/lib/subtrack-details';
import { ALL_SUBTRACKS } from '@/lib/subtracks';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Clock, Dumbbell, Target, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Sport } from '@/lib/types';

const SPORT_LABELS: Record<string, string> = {
  crossfit: 'CrossFit',
  hyrox: 'Hyrox',
  athx: 'ATHX',
};

const SPORT_COLORS: Record<string, string> = {
  crossfit: '#F05A28',
  hyrox: '#3b82f6',
  athx: '#a855f7',
};

export default function SubtrackPreviewPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { profile, refreshProfile } = useAuth();
  const queryClient = useQueryClient();
  const [confirming, setConfirming] = useState(false);

  const { data: subtracks = ALL_SUBTRACKS } = useSubtracks();
  const getSport = buildSportFromSubtrack(subtracks);

  const sport = getSport(id);
  const sportLabel = SPORT_LABELS[sport] ?? sport;
  const sportColor = SPORT_COLORS[sport] ?? '#F05A28';

  const subtrackInfo = subtracks
    .flatMap(g => g.subtracks)
    .find(s => s.id === id);

  const detail = getSubtrackDetail(id);
  const isCurrent = profile?.subtrack === id;

  async function handleConfirm() {
    if (!profile || isCurrent) { setLocation('/'); return; }
    setConfirming(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ subtrack: id, sport: getSport(id) as Sport })
        .eq('id', profile.id);
      if (error) throw error;
      await refreshProfile();
      queryClient.invalidateQueries({ queryKey: ['nextWorkout'] });
      toast.success(`Switched to ${subtrackInfo?.name ?? id}`);
      setLocation('/');
    } catch (err) {
      toast.error('Failed to switch track. Try again.');
      setConfirming(false);
    }
  }

  if (!subtrackInfo) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Track not found.</p>
          <Button variant="outline" onClick={() => setLocation('/')}>Back to Feed</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* Header */}
      <div className="flex items-center gap-4 px-5 pt-12 pb-4">
        <button
          onClick={() => setLocation('/')}
          className="flex items-center justify-center w-10 h-10 rounded-full border border-white/15 bg-card/60 text-white/70 hover:text-white hover:border-white/30 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <span className="text-sm text-muted-foreground font-medium">Track Details</span>
      </div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex-1 px-5 pb-36 space-y-8"
      >

        {/* Sport badge + Title */}
        <div className="space-y-3">
          <div
            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest"
            style={{ background: `${sportColor}20`, color: sportColor }}
          >
            {sportLabel}
          </div>
          <h1 className="text-4xl font-display uppercase tracking-wide text-white leading-tight">
            {subtrackInfo.name}
          </h1>
          <p className="text-muted-foreground text-base leading-relaxed">
            {subtrackInfo.desc}
          </p>
        </div>

        {/* Duration / Frequency pills */}
        {detail && (
          <div className="flex gap-3 flex-wrap">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-card/60 border border-white/10 text-sm text-white/80">
              <Clock className="w-4 h-4 text-primary" />
              {detail.duration}
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-card/60 border border-white/10 text-sm text-white/80">
              <Dumbbell className="w-4 h-4 text-primary" />
              {detail.frequency}
            </div>
          </div>
        )}

        {/* Why this track */}
        {detail && (
          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Why this track</h2>
            <div className="bg-card/40 border border-white/8 rounded-2xl p-5">
              <p className="text-sm text-white/80 leading-relaxed">{detail.rationale}</p>
            </div>
          </div>
        )}

        {/* Key movements */}
        {detail && detail.focusMovements.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Key movements</h2>
            <div className="flex flex-wrap gap-2">
              {detail.focusMovements.map(m => (
                <span
                  key={m}
                  className="px-3 py-1.5 rounded-lg bg-card/60 border border-white/10 text-sm text-white/80 font-medium"
                >
                  {m}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Goals */}
        {detail && detail.goals.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Target className="w-3.5 h-3.5" /> Goals & targets
            </h2>
            <ul className="space-y-3">
              {detail.goals.map((g, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" style={{ color: sportColor }} />
                  <span className="text-sm text-white/80 leading-relaxed">{g}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

      </motion.div>

      {/* Sticky bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-background via-background/95 to-transparent pt-8">
        <div className="flex gap-3 max-w-lg mx-auto">
          <Button
            variant="outline"
            className="flex-1 h-14"
            onClick={() => setLocation('/')}
            disabled={confirming}
          >
            Go Back
          </Button>

          {isCurrent ? (
            <Button
              className="flex-1 h-14 opacity-60 cursor-default"
              disabled
            >
              Currently Active
            </Button>
          ) : (
            <Button
              className="flex-1 h-14 text-base font-semibold"
              style={{ background: `linear-gradient(135deg, ${sportColor}, ${sportColor}cc)` }}
              onClick={handleConfirm}
              disabled={confirming}
            >
              {confirming ? 'Switching…' : 'Start This Track'}
            </Button>
          )}
        </div>
      </div>

    </div>
  );
}
